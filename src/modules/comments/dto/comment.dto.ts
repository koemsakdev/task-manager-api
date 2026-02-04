import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'This looks good!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateCommentDto extends PartialType(CreateCommentDto) {}
