import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsUUID,
  IsArray,
} from 'class-validator';
import { ProjectStatus } from '../../../common/constants';

export class CreateProjectDto {
  @ApiProperty({ example: 'My New Project' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Project description here' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}

export class AddMemberDto {
  @ApiProperty({ description: 'User ID to add' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Role ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ description: 'New role ID' })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

export class InviteMembersDto {
  @ApiProperty({ type: [String], description: 'Array of user IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({ description: 'Role ID to assign to all members' })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string;

  @ApiProperty()
  status: ProjectStatus;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
