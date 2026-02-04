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
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
  UpdateMemberRoleDto,
} from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProjectStatus } from '../../common/constants';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(
    @CurrentUser() user: User,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for current user' })
  @ApiQuery({ name: 'status', enum: ProjectStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns list of projects' })
  async findAll(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.findAll(user.id, pagination, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Returns project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can delete' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.projectsService.remove(id, user.id);
  }

  // Member management endpoints
  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members' })
  @ApiResponse({ status: 200, description: 'Returns list of members' })
  async getMembers(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projectsService.getMembers(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  async addMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.projectsService.addMember(id, user.id, addMemberDto);
  }

  @Put(':id/members/:memberId')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async updateMemberRole(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() updateDto: UpdateMemberRoleDto,
  ) {
    return this.projectsService.updateMemberRole(id, memberId, user.id, updateDto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from project' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  async removeMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    await this.projectsService.removeMember(id, memberId, user.id);
  }
}
