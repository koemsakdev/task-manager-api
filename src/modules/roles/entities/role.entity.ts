import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ length: 50, unique: true })
  name: string;

  @Column({ type: 'jsonb' })
  permissions: Record<string, string[]>;

  @OneToMany(() => ProjectMember, (member) => member.role)
  projectMembers: ProjectMember[];
}
