import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { Label } from './entities/label.entity';
import { TaskLabel } from './entities/task-label.entity';
import { ProjectsService } from '../projects/projects.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  CreateLabelDto,
  UpdateLabelDto,
} from './dto/task.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { ActivityAction, EntityType } from '../../common/constants';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private assigneeRepository: Repository<TaskAssignee>,
    @InjectRepository(Label)
    private labelRepository: Repository<Label>,
    @InjectRepository(TaskLabel)
    private taskLabelRepository: Repository<TaskLabel>,
    private projectsService: ProjectsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(
    projectId: string,
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    // Check permission
    const canCreate = await this.projectsService.hasPermission(
      projectId,
      userId,
      'task',
      'create',
    );
    if (!canCreate) {
      throw new ForbiddenException('You do not have permission to create tasks');
    }

    const { assigneeIds, labelIds, ...taskData } = createTaskDto;

    const task = this.taskRepository.create({
      ...taskData,
      projectId,
      createdById: userId,
    });

    await this.taskRepository.save(task);

    // Add assignees
    if (assigneeIds?.length) {
      await this.assignTask(task.id, projectId, userId, assigneeIds);
    }

    // Add labels
    if (labelIds?.length) {
      await this.addLabelsToTask(task.id, labelIds);
    }

    // Log activity
    await this.activityLogsService.log({
      projectId,
      userId,
      action: ActivityAction.CREATED,
      entityType: EntityType.TASK,
      entityId: task.id,
      details: { title: task.title },
    });

    return this.findOne(task.id, projectId, userId);
  }

  async findAll(
    projectId: string,
    userId: string,
    pagination: PaginationDto,
    filters?: TaskFilterDto,
  ): Promise<PaginatedResponseDto<Task>> {
    // Check access
    await this.projectsService.findOne(projectId, userId);

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'creator')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('task.taskLabels', 'taskLabels')
      .leftJoinAndSelect('taskLabels.label', 'label')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.parentTaskId IS NULL'); // Only top-level tasks

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.priority) {
      queryBuilder.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }
    if (filters?.assigneeId) {
      queryBuilder.andWhere('assignees.userId = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }
    if (filters?.labelId) {
      queryBuilder.andWhere('taskLabels.labelId = :labelId', {
        labelId: filters.labelId,
      });
    }
    if (filters?.search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder
      .select([
        'task',
        'creator.id',
        'creator.fullName',
        'creator.avatarUrl',
        'assignees',
        'assigneeUser.id',
        'assigneeUser.fullName',
        'assigneeUser.avatarUrl',
        'taskLabels',
        'label',
      ])
      .orderBy('task.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, projectId: string, userId: string): Promise<Task> {
    // Check access
    await this.projectsService.findOne(projectId, userId);

    const task = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'creator')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'assigneeUser')
      .leftJoinAndSelect('task.taskLabels', 'taskLabels')
      .leftJoinAndSelect('taskLabels.label', 'label')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .leftJoinAndSelect('task.parentTask', 'parentTask')
      .where('task.id = :id', { id })
      .andWhere('task.projectId = :projectId', { projectId })
      .select([
        'task',
        'creator.id',
        'creator.fullName',
        'creator.avatarUrl',
        'assignees',
        'assigneeUser.id',
        'assigneeUser.fullName',
        'assigneeUser.avatarUrl',
        'taskLabels',
        'label',
        'subtasks',
        'parentTask.id',
        'parentTask.title',
      ])
      .getOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    projectId: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(id, projectId, userId);

    // Check permission
    const canUpdate = await this.projectsService.hasPermission(
      projectId,
      userId,
      'task',
      'update',
    );
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update tasks');
    }

    const { assigneeIds, labelIds, ...taskData } = updateTaskDto;

    Object.assign(task, taskData);
    await this.taskRepository.save(task);

    // Update assignees if provided
    if (assigneeIds !== undefined) {
      await this.updateAssignees(id, projectId, userId, assigneeIds);
    }

    // Update labels if provided
    if (labelIds !== undefined) {
      await this.updateTaskLabels(id, labelIds);
    }

    // Log activity
    await this.activityLogsService.log({
      projectId,
      userId,
      action: ActivityAction.UPDATED,
      entityType: EntityType.TASK,
      entityId: id,
      details: taskData,
    });

    return this.findOne(id, projectId, userId);
  }

  async remove(id: string, projectId: string, userId: string): Promise<void> {
    const task = await this.findOne(id, projectId, userId);

    // Check permission
    const canDelete = await this.projectsService.hasPermission(
      projectId,
      userId,
      'task',
      'delete',
    );
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete tasks');
    }

    await this.taskRepository.remove(task);

    // Log activity
    await this.activityLogsService.log({
      projectId,
      userId,
      action: ActivityAction.DELETED,
      entityType: EntityType.TASK,
      entityId: id,
      details: { title: task.title },
    });
  }

  async assignTask(
    taskId: string,
    projectId: string,
    userId: string,
    assigneeIds: string[],
  ): Promise<TaskAssignee[]> {
    // Check permission
    const canAssign = await this.projectsService.hasPermission(
      projectId,
      userId,
      'task',
      'assign',
    );
    if (!canAssign) {
      throw new ForbiddenException('You do not have permission to assign tasks');
    }

    const assignees = assigneeIds.map((assigneeId) =>
      this.assigneeRepository.create({
        taskId,
        userId: assigneeId,
      }),
    );

    await this.assigneeRepository.save(assignees);

    // Log activity
    await this.activityLogsService.log({
      projectId,
      userId,
      action: ActivityAction.ASSIGNED,
      entityType: EntityType.TASK,
      entityId: taskId,
      details: { assigneeIds },
    });

    return assignees;
  }

  private async updateAssignees(
    taskId: string,
    projectId: string,
    userId: string,
    assigneeIds: string[],
  ): Promise<void> {
    // Remove all existing assignees
    await this.assigneeRepository.delete({ taskId });

    // Add new assignees
    if (assigneeIds.length) {
      await this.assignTask(taskId, projectId, userId, assigneeIds);
    }
  }

  private async addLabelsToTask(
    taskId: string,
    labelIds: string[],
  ): Promise<void> {
    const taskLabels = labelIds.map((labelId) =>
      this.taskLabelRepository.create({
        taskId,
        labelId,
      }),
    );

    await this.taskLabelRepository.save(taskLabels);
  }

  private async updateTaskLabels(
    taskId: string,
    labelIds: string[],
  ): Promise<void> {
    await this.taskLabelRepository.delete({ taskId });

    if (labelIds.length) {
      await this.addLabelsToTask(taskId, labelIds);
    }
  }

  // Label management
  async createLabel(
    projectId: string,
    userId: string,
    createLabelDto: CreateLabelDto,
  ): Promise<Label> {
    await this.projectsService.findOne(projectId, userId);

    const label = this.labelRepository.create({
      ...createLabelDto,
      projectId,
    });

    return this.labelRepository.save(label);
  }

  async getLabels(projectId: string, userId: string): Promise<Label[]> {
    await this.projectsService.findOne(projectId, userId);

    return this.labelRepository.find({
      where: { projectId },
      order: { name: 'ASC' },
    });
  }

  async updateLabel(
    labelId: string,
    projectId: string,
    userId: string,
    updateLabelDto: UpdateLabelDto,
  ): Promise<Label> {
    await this.projectsService.findOne(projectId, userId);

    const label = await this.labelRepository.findOne({
      where: { id: labelId, projectId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    Object.assign(label, updateLabelDto);
    return this.labelRepository.save(label);
  }

  async deleteLabel(
    labelId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    await this.projectsService.findOne(projectId, userId);

    const label = await this.labelRepository.findOne({
      where: { id: labelId, projectId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    await this.labelRepository.remove(label);
  }

  // Calendar view - tasks with due dates
  async getCalendarTasks(
    projectId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Task[]> {
    await this.projectsService.findOne(projectId, userId);

    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('assignees.user', 'user')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.dueDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }

  // Dashboard stats
  async getTaskStats(projectId: string, userId: string): Promise<any> {
    await this.projectsService.findOne(projectId, userId);

    const stats = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.projectId = :projectId', { projectId })
      .groupBy('task.status')
      .getRawMany();

    const priorityStats = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('task.projectId = :projectId', { projectId })
      .groupBy('task.priority')
      .getRawMany();

    return {
      byStatus: stats,
      byPriority: priorityStats,
    };
  }
}
