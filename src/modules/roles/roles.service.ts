import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RoleType, DEFAULT_PERMISSIONS } from '../../common/constants';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    // Seed default roles on startup
    await this.seedDefaultRoles();
  }

  private async seedDefaultRoles(): Promise<void> {
    const defaultRoles = [
      { name: RoleType.ADMIN, permissions: DEFAULT_PERMISSIONS[RoleType.ADMIN] },
      { name: RoleType.MANAGER, permissions: DEFAULT_PERMISSIONS[RoleType.MANAGER] },
      { name: RoleType.MEMBER, permissions: DEFAULT_PERMISSIONS[RoleType.MEMBER] },
    ];

    for (const roleData of defaultRoles) {
      const existing = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existing) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
      }
    }
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // Prevent modifying default roles
    if (Object.values(RoleType).includes(role.name as RoleType)) {
      throw new ConflictException('Cannot modify default roles');
    }

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    // Prevent deleting default roles
    if (Object.values(RoleType).includes(role.name as RoleType)) {
      throw new ConflictException('Cannot delete default roles');
    }

    await this.roleRepository.remove(role);
  }
}
