import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../../../common/constants';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login feature' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Task description here' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Parent task ID for subtasks' })
  @IsUUID()
  @IsOptional()
  parentTaskId?: string;

  @ApiPropertyOptional({ type: [String], description: 'User IDs to assign' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  assigneeIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Label IDs to attach' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  labelIds?: string[];
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}

export class AssignTaskDto {
  @ApiProperty({ type: [String], description: 'User IDs to assign' })
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds: string[];
}

export class TaskFilterDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Filter by assignee' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Filter by label' })
  @IsUUID()
  @IsOptional()
  labelId?: string;

  @ApiPropertyOptional({ description: 'Search in title/description' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class CreateLabelDto {
  @ApiProperty({ example: 'Bug' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '#FF0000' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  color: string;
}

export class UpdateLabelDto extends PartialType(CreateLabelDto) {}
