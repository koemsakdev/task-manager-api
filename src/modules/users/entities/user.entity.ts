import { Entity, Column, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { Task } from '../../tasks/entities/task.entity';
import { TaskAssignee } from '../../tasks/entities/task-assignee.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { TimeLog } from '../../time-logs/entities/time-log.entity';
import { File } from '../../files/entities/file.entity';
import { Message } from '../../messages/entities/message.entity';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity("users")
export class User extends BaseEntity {
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ name: "full_name", length: 100 })
  fullName: string;

  @Column({ name: "avatar_url", length: 500, nullable: true })
  avatarUrl: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => ProjectMember, (member) => member.user)
  projectMemberships: ProjectMember[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => TaskAssignee, (assignee) => assignee.user)
  taskAssignments: TaskAssignee[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => TimeLog, (timeLog) => timeLog.user)
  timeLogs: TimeLog[];

  @OneToMany(() => File, (file) => file.uploadedBy)
  uploadedFiles: File[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @OneToMany(() => ActivityLog, (log) => log.user)
  activityLogs: ActivityLog[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
