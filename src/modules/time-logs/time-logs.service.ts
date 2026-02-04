import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeLog } from './entities/time-log.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  CreateTimeLogDto,
  UpdateTimeLogDto,
  TimeLogFilterDto,
} from './dto/time-log.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { ActivityAction, EntityType } from '../../common/constants';

@Injectable()
export class TimeLogsService {
  constructor(
    @InjectRepository(TimeLog)
    private timeLogRepository: Repository<TimeLog>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private projectsService: ProjectsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(
    taskId: string,
    userId: string,
    createTimeLogDto: CreateTimeLogDto,
  ): Promise<TimeLog> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.projectsService.findOne(task.projectId, userId);

    const timeLog = this.timeLogRepository.create({
      ...createTimeLogDto,
      taskId,
      userId,
    });

    await this.timeLogRepository.save(timeLog);

    // Log activity
    await this.activityLogsService.log({
      projectId: task.projectId,
      userId,
      action: ActivityAction.CREATED,
      entityType: EntityType.TIME_LOG,
      entityId: timeLog.id,
      details: { taskId, durationMinutes: createTimeLogDto.durationMinutes },
    });

    return this.findOne(timeLog.id, userId);
  }

  async findAllForTask(
    taskId: string,
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<TimeLog>> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectsService.findOne(task.projectId, userId);

    const queryBuilder = this.timeLogRepository
      .createQueryBuilder('timeLog')
      .leftJoinAndSelect('timeLog.user', 'user')
      .where('timeLog.taskId = :taskId', { taskId })
      .select([
        'timeLog',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('timeLog.loggedAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async findAllForProject(
    projectId: string,
    userId: string,
    pagination: PaginationDto,
    filters?: TimeLogFilterDto,
  ): Promise<PaginatedResponseDto<TimeLog>> {
    await this.projectsService.findOne(projectId, userId);

    const queryBuilder = this.timeLogRepository
      .createQueryBuilder('timeLog')
      .leftJoinAndSelect('timeLog.user', 'user')
      .leftJoinAndSelect('timeLog.task', 'task')
      .where('task.projectId = :projectId', { projectId })
      .select([
        'timeLog',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
        'task.id',
        'task.title',
      ]);

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('timeLog.loggedAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    queryBuilder
      .orderBy('timeLog.loggedAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, userId: string): Promise<TimeLog> {
    const timeLog = await this.timeLogRepository
      .createQueryBuilder('timeLog')
      .leftJoinAndSelect('timeLog.user', 'user')
      .leftJoinAndSelect('timeLog.task', 'task')
      .where('timeLog.id = :id', { id })
      .select([
        'timeLog',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
        'task.id',
        'task.title',
        'task.projectId',
      ])
      .getOne();

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    await this.projectsService.findOne(timeLog.task.projectId, userId);

    return timeLog;
  }

  async update(
    id: string,
    userId: string,
    updateTimeLogDto: UpdateTimeLogDto,
  ): Promise<TimeLog> {
    const timeLog = await this.findOne(id, userId);

    // Only the user who logged the time can update
    if (timeLog.userId !== userId) {
      throw new ForbiddenException('You can only edit your own time logs');
    }

    Object.assign(timeLog, updateTimeLogDto);
    await this.timeLogRepository.save(timeLog);

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const timeLog = await this.findOne(id, userId);

    // Only the user who logged the time can delete
    if (timeLog.userId !== userId) {
      throw new ForbiddenException('You can only delete your own time logs');
    }

    await this.timeLogRepository.remove(timeLog);
  }

  async getProjectTimeReport(
    projectId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    await this.projectsService.findOne(projectId, userId);

    // Total time by user
    const byUser = await this.timeLogRepository
      .createQueryBuilder('timeLog')
      .leftJoin('timeLog.task', 'task')
      .leftJoin('timeLog.user', 'user')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('timeLog.loggedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select('user.id', 'userId')
      .addSelect('user.fullName', 'fullName')
      .addSelect('SUM(timeLog.durationMinutes)', 'totalMinutes')
      .groupBy('user.id')
      .addGroupBy('user.fullName')
      .getRawMany();

    // Total time by task
    const byTask = await this.timeLogRepository
      .createQueryBuilder('timeLog')
      .leftJoin('timeLog.task', 'task')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('timeLog.loggedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select('task.id', 'taskId')
      .addSelect('task.title', 'taskTitle')
      .addSelect('SUM(timeLog.durationMinutes)', 'totalMinutes')
      .groupBy('task.id')
      .addGroupBy('task.title')
      .getRawMany();

    // Total time
    const total = await this.timeLogRepository
      .createQueryBuilder('timeLog')
      .leftJoin('timeLog.task', 'task')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('timeLog.loggedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .select('SUM(timeLog.durationMinutes)', 'totalMinutes')
      .getRawOne();

    return {
      byUser,
      byTask,
      totalMinutes: parseInt(total?.totalMinutes || '0'),
    };
  }
}
