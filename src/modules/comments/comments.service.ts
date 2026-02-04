import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { ActivityAction, EntityType } from '../../common/constants';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private projectsService: ProjectsService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(
    taskId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.projectsService.findOne(task.projectId, userId);

    const comment = this.commentRepository.create({
      ...createCommentDto,
      taskId,
      userId,
    });

    await this.commentRepository.save(comment);

    // Log activity
    await this.activityLogsService.log({
      projectId: task.projectId,
      userId,
      action: ActivityAction.COMMENTED,
      entityType: EntityType.COMMENT,
      entityId: comment.id,
      details: { taskId, content: createCommentDto.content.substring(0, 100) },
    });

    return this.findOne(comment.id, userId);
  }

  async findAll(
    taskId: string,
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Comment>> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.projectsService.findOne(task.projectId, userId);

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.taskId = :taskId', { taskId })
      .select([
        'comment',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('comment.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, userId: string): Promise<Comment> {
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.task', 'task')
      .where('comment.id = :id', { id })
      .select([
        'comment',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
        'task.id',
        'task.projectId',
      ])
      .getOne();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check access
    await this.projectsService.findOne(comment.task.projectId, userId);

    return comment;
  }

  async update(
    id: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findOne(id, userId);

    // Only comment author can update
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    Object.assign(comment, updateCommentDto);
    await this.commentRepository.save(comment);

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id, userId);

    // Only comment author can delete
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }
}
