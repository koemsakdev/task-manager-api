import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ActivityAction, EntityType } from '../../../common/constants';

export class CreateActivityLogDto {
  projectId: string;
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string;
  details?: Record<string, any>;
}

export class ActivityLogFilterDto {
  @ApiPropertyOptional({ enum: ActivityAction })
  @IsEnum(ActivityAction)
  @IsOptional()
  action?: ActivityAction;

  @ApiPropertyOptional({ enum: EntityType })
  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
