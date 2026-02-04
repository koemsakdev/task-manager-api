import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(
    pagination: PaginationDto,
    search?: string,
  ): Promise<PaginatedResponseDto<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.avatarUrl',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (search) {
      queryBuilder.where(
        'user.fullName ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');
    queryBuilder.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'fullName',
        'avatarUrl',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async getProfile(userId: string): Promise<User> {
    return this.findOne(userId);
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.update(userId, updateUserDto);
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    return this.userRepository.find({
      where: [
        { fullName: Like(`%${query}%`), isActive: true },
        { email: Like(`%${query}%`), isActive: true },
      ],
      select: ['id', 'email', 'fullName', 'avatarUrl'],
      take: limit,
    });
  }
}
