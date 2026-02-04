import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsObject } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'custom_role' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: {
      project: ['read', 'update'],
      task: ['create', 'read', 'update'],
    },
  })
  @IsObject()
  permissions: Record<string, string[]>;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
