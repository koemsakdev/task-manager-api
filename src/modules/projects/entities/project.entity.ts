import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProjectStatus } from '../../../common/constants';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Label } from '../../tasks/entities/label.entity';
import { File } from '../../files/entities/file.entity';
import { Message } from '../../messages/entities/message.entity';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';

@Entity('projects')
export class Project extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  // Relations
  @ManyToOne(() => User, (user) => user.ownedProjects)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @OneToMany(() => Label, (label) => label.project)
  labels: Label[];

  @OneToMany(() => File, (file) => file.project)
  files: File[];

  @OneToMany(() => Message, (message) => message.project)
  messages: Message[];

  @OneToMany(() => ActivityLog, (log) => log.project)
  activityLogs: ActivityLog[];
}
