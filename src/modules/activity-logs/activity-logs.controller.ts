import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogFilterDto } from './dto/activity-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Activity Logs')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get('projects/:projectId/activity')
  @ApiOperation({ summary: 'Get activity logs for a project' })
  @ApiResponse({ status: 200, description: 'Returns list of activity logs' })
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: ActivityLogFilterDto,
  ) {
    return this.activityLogsService.findAll(projectId, pagination, filters);
  }

  @Get('projects/:projectId/activity/recent')
  @ApiOperation({ summary: 'Get recent activity for a project' })
  async getRecent(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.activityLogsService.getRecentActivity(projectId, limit);
  }

  @Get('users/me/activity')
  @ApiOperation({ summary: 'Get current user activity' })
  async getUserActivity(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.activityLogsService.getUserActivity(user.id, pagination);
  }
}
