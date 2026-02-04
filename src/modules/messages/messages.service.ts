import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateMessageDto } from './dto/message.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private projectsService: ProjectsService,
  ) {}

  async create(
    projectId: string,
    userId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    // Check access
    await this.projectsService.findOne(projectId, userId);

    const message = this.messageRepository.create({
      ...createMessageDto,
      projectId,
      userId,
    });

    await this.messageRepository.save(message);

    return this.findOne(message.id, userId);
  }

  async findAll(
    projectId: string,
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Message>> {
    // Check access
    await this.projectsService.findOne(projectId, userId);

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message.projectId = :projectId', { projectId })
      .select([
        'message',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('message.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message.id = :id', { id })
      .select([
        'message',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .getOne();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check access
    await this.projectsService.findOne(message.projectId, userId);

    return message;
  }

  async getRecentMessages(
    projectId: string,
    userId: string,
    limit: number = 50,
  ): Promise<Message[]> {
    // Check access
    await this.projectsService.findOne(projectId, userId);

    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message.projectId = :projectId', { projectId })
      .select([
        'message',
        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('message.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
