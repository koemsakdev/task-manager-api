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
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  AssignTaskDto,
  CreateLabelDto,
  UpdateLabelDto,
} from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Tasks')
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks in a project' })
  @ApiResponse({ status: 200, description: 'Returns list of tasks' })
  async findAll(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: TaskFilterDto,
  ) {
    return this.tasksService.findAll(projectId, user.id, pagination, filters);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get tasks for calendar view' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCalendarTasks(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.tasksService.getCalendarTasks(
      projectId,
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.tasksService.getTaskStats(projectId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Returns task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.findOne(id, projectId, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async update(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, projectId, user.id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  async remove(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.tasksService.remove(id, projectId, user.id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign users to task' })
  async assignTask(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignTaskDto,
  ) {
    return this.tasksService.assignTask(
      id,
      projectId,
      user.id,
      assignDto.assigneeIds,
    );
  }
}

// Labels Controller (nested under projects)
@ApiTags('Labels')
@Controller('projects/:projectId/labels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LabelsController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new label' })
  async create(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createLabelDto: CreateLabelDto,
  ) {
    return this.tasksService.createLabel(projectId, user.id, createLabelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all labels in a project' })
  async findAll(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.tasksService.getLabels(projectId, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update label' })
  async update(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLabelDto: UpdateLabelDto,
  ) {
    return this.tasksService.updateLabel(id, projectId, user.id, updateLabelDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete label' })
  async remove(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.tasksService.deleteLabel(id, projectId, user.id);
  }
}
