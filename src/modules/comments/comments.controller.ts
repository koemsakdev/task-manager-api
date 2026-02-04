import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Comments')
@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add comment to task' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  async create(
    @CurrentUser() user: User,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, user.id, createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiResponse({ status: 200, description: 'Returns list of comments' })
  async findAll(
    @CurrentUser() user: User,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.commentsService.findAll(taskId, user.id, pagination);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, user.id, updateCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.commentsService.remove(id, user.id);
  }
}
