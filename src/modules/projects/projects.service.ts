import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Role } from '../roles/entities/role.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
  UpdateMemberRoleDto,
} from './dto/project.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { RoleType, ProjectStatus } from '../../common/constants';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActivityAction, EntityType } from '../../common/constants';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private memberRepository: Repository<ProjectMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      ownerId: userId,
    });

    await this.projectRepository.save(project);

    // Add owner as admin member
    const adminRole = await this.roleRepository.findOne({
      where: { name: RoleType.ADMIN },
    });

    if (adminRole) {
      const member = this.memberRepository.create({
        projectId: project.id,
        userId,
        roleId: adminRole.id,
      });
      await this.memberRepository.save(member);
    }

    // Log activity
    await this.activityLogsService.log({
      projectId: project.id,
      userId,
      action: ActivityAction.CREATED,
      entityType: EntityType.PROJECT,
      entityId: project.id,
      details: { name: project.name },
    });

    return this.findOne(project.id, userId);
  }

  async findAll(
    userId: string,
    pagination: PaginationDto,
    status?: ProjectStatus,
  ): Promise<PaginatedResponseDto<Project>> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.members', 'member')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('(project.ownerId = :userId OR member.userId = :userId)', { userId });

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    queryBuilder
      .select([
        'project.id',
        'project.name',
        'project.description',
        'project.status',
        'project.ownerId',
        'project.createdAt',
        'project.updatedAt',
        'owner.id',
        'owner.fullName',
        'owner.avatarUrl',
      ])
      .orderBy('project.updatedAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, pagination);
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('members.role', 'memberRole')
      .where('project.id = :id', { id })
      .select([
        'project',
        'owner.id',
        'owner.fullName',
        'owner.email',
        'owner.avatarUrl',
        'members',
        'memberUser.id',
        'memberUser.fullName',
        'memberUser.email',
        'memberUser.avatarUrl',
        'memberRole.id',
        'memberRole.name',
      ])
      .getOne();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access
    const isMember = await this.isMember(id, userId);
    if (!isMember && project.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async update(
    id: string,
    userId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id, userId);

    // Check permission
    const canUpdate = await this.hasPermission(id, userId, 'project', 'update');
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this project');
    }

    Object.assign(project, updateProjectDto);
    await this.projectRepository.save(project);

    // Log activity
    await this.activityLogsService.log({
      projectId: id,
      userId,
      action: ActivityAction.UPDATED,
      entityType: EntityType.PROJECT,
      entityId: id,
      details: updateProjectDto,
    });

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id, userId);

    // Only owner can delete
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete the project');
    }

    await this.projectRepository.remove(project);
  }

  async addMember(
    projectId: string,
    userId: string,
    addMemberDto: AddMemberDto,
  ): Promise<ProjectMember> {
    // Check permission
    const canManageMembers = await this.hasPermission(
      projectId,
      userId,
      'project',
      'manage_members',
    );
    if (!canManageMembers) {
      throw new ForbiddenException('You do not have permission to manage members');
    }

    // Check if already a member
    const existingMember = await this.memberRepository.findOne({
      where: { projectId, userId: addMemberDto.userId },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    const member = this.memberRepository.create({
      projectId,
      userId: addMemberDto.userId,
      roleId: addMemberDto.roleId,
    });

    await this.memberRepository.save(member);

    // Log activity
    await this.activityLogsService.log({
      projectId,
      userId,
      action: ActivityAction.ASSIGNED,
      entityType: EntityType.MEMBER,
      entityId: addMemberDto.userId,
      details: { roleId: addMemberDto.roleId },
    });

    return this.memberRepository.findOne({
      where: { id: member.id },
      relations: ['user', 'role'],
    });
  }

  async removeMember(
    projectId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    const canManageMembers = await this.hasPermission(
      projectId,
      userId,
      'project',
      'manage_members',
    );
    if (!canManageMembers) {
      throw new ForbiddenException('You do not have permission to manage members');
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId, projectId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove project owner
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (member.userId === project.ownerId) {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    await this.memberRepository.remove(member);

    // Log activity
    await this.activityLogsService.log({
      projectId,
      userId,
      action: ActivityAction.UNASSIGNED,
      entityType: EntityType.MEMBER,
      entityId: member.userId,
    });
  }

  async updateMemberRole(
    projectId: string,
    memberId: string,
    userId: string,
    updateDto: UpdateMemberRoleDto,
  ): Promise<ProjectMember> {
    const canManageMembers = await this.hasPermission(
      projectId,
      userId,
      'project',
      'manage_members',
    );
    if (!canManageMembers) {
      throw new ForbiddenException('You do not have permission to manage members');
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId, projectId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.roleId = updateDto.roleId;
    await this.memberRepository.save(member);

    return this.memberRepository.findOne({
      where: { id: member.id },
      relations: ['user', 'role'],
    });
  }

  async getMembers(projectId: string, userId: string): Promise<ProjectMember[]> {
    await this.findOne(projectId, userId); // Check access

    return this.memberRepository.find({
      where: { projectId },
      relations: ['user', 'role'],
    });
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });
    return !!member;
  }

  async hasPermission(
    projectId: string,
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    // Owner has all permissions
    if (project?.ownerId === userId) {
      return true;
    }

    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
      relations: ['role'],
    });

    if (!member) {
      return false;
    }

    const permissions = member.role?.permissions;
    return permissions?.[resource]?.includes(action) || false;
  }

  async getUserRole(projectId: string, userId: string): Promise<Role | null> {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
      relations: ['role'],
    });

    return member?.role || null;
  }
}
