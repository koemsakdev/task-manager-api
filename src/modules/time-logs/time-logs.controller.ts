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
import { TimeLogsService } from './time-logs.service';
import {
  CreateTimeLogDto,
  UpdateTimeLogDto,
  TimeLogFilterDto,
} from './dto/time-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Time Logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller()
export class TimeLogsController {
  constructor(private readonly timeLogsService: TimeLogsService) {}

  // Task-level time logs
  @Post('tasks/:taskId/time-logs')
  @ApiOperation({ summary: 'Log time for a task' })
  @ApiResponse({ status: 201, description: 'Time logged successfully' })
  async create(
    @CurrentUser() user: User,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() createTimeLogDto: CreateTimeLogDto,
  ) {
    return this.timeLogsService.create(taskId, user.id, createTimeLogDto);
  }

  @Get('tasks/:taskId/time-logs')
  @ApiOperation({ summary: 'Get time logs for a task' })
  async findAllForTask(
    @CurrentUser() user: User,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.timeLogsService.findAllForTask(taskId, user.id, pagination);
  }

  // Project-level time logs
  @Get('projects/:projectId/time-logs')
  @ApiOperation({ summary: 'Get all time logs for a project' })
  async findAllForProject(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: TimeLogFilterDto,
  ) {
    return this.timeLogsService.findAllForProject(
      projectId,
      user.id,
      pagination,
      filters,
    );
  }

  @Get('projects/:projectId/time-logs/report')
  @ApiOperation({ summary: 'Get time report for a project' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getProjectTimeReport(
    @CurrentUser() user: User,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.timeLogsService.getProjectTimeReport(
      projectId,
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // Individual time log operations
  @Get('time-logs/:id')
  @ApiOperation({ summary: 'Get time log by ID' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.timeLogsService.findOne(id, user.id);
  }

  @Put('time-logs/:id')
  @ApiOperation({ summary: 'Update time log' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTimeLogDto: UpdateTimeLogDto,
  ) {
    return this.timeLogsService.update(id, user.id, updateTimeLogDto);
  }

  @Delete('time-logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete time log' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.timeLogsService.remove(id, user.id);
  }
}
