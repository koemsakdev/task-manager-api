import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello team!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}
