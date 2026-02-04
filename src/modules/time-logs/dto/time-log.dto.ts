import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateTimeLogDto {
  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ example: 'Worked on login feature' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  loggedAt: string;
}

export class UpdateTimeLogDto extends PartialType(CreateTimeLogDto) {}

export class TimeLogFilterDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
