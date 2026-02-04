import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Files')
@Controller('projects/:projectId/files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a file to project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        taskId: {
          type: 'string',
          nullable: true,
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Query('taskId') taskId?: string,
  ) {
    return this.filesService.upload(projectId, user.id, file, taskId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all files in a project' })
  @ApiQuery({ name: 'taskId', required: false })
  async findAll(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() pagination: PaginationDto,
    @Query('taskId') taskId?: string,
  ) {
    return this.filesService.findAll(projectId, user.id, pagination, taskId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file details' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.filesService.findOne(id, user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  async download(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const filePath = await this.filesService.getDownloadPath(id, user.id);
    const file = await this.filesService.findOne(id, user.id);
    res.download(filePath, file.fileName);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.filesService.remove(id, user.id);
  }
}
