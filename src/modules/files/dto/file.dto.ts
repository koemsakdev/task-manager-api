import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'Task ID to attach file to' })
  @IsUUID()
  @IsOptional()
  taskId?: string;
}

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty({ nullable: true })
  taskId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  createdAt: Date;
}
