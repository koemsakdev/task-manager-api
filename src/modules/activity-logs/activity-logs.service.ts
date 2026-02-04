import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import {
  CreateActivityLogDto,
  ActivityLogFilterDto,
} from './dto/activity-log.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async log(createDto: CreateActivityLogDto): Promise<ActivityLog> {
    const log = this.activityLogRepository.create(createDto);
    return this.activityLogRepository.save(log);
  }

  async findAll(
    projectId: string,
    pagination: PaginationDto,
    filters?: ActivityLogFilterDto,
  ): Promise<PaginatedResponseDto<ActivityLog>> {
    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.projectId = :projectId', { projectId });

    if (filters?.action) {
      queryBuilder.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters?.entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    queryBuilder
      .select([
        'log',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('log.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async getRecentActivity(projectId: string, limit: number = 20): Promise<ActivityLog[]> {
    return this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('log.projectId = :projectId', { projectId })
      .select([
        'log',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getUserActivity(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<ActivityLog>> {
    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.project', 'project')
      .where('log.userId = :userId', { userId })
      .select([
        'log',
        'project.id',
        'project.name',
      ])
      .orderBy('log.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }
}
