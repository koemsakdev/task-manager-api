import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TaskStatus, TaskPriority } from '../../../common/constants';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { TaskAssignee } from './task-assignee.entity';
import { TaskLabel } from './task-label.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { TimeLog } from '../../time-logs/entities/time-log.entity';
import { File } from '../../files/entities/file.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @Column({ name: 'parent_task_id', nullable: true })
  parentTaskId: string;

  // Relations
  @ManyToOne(() => Project, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @ManyToOne(() => Task, (task) => task.subtasks, { nullable: true })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask: Task;

  @OneToMany(() => Task, (task) => task.parentTask)
  subtasks: Task[];

  @OneToMany(() => TaskAssignee, (assignee) => assignee.task)
  assignees: TaskAssignee[];

  @OneToMany(() => TaskLabel, (taskLabel) => taskLabel.task)
  taskLabels: TaskLabel[];

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => TimeLog, (timeLog) => timeLog.task)
  timeLogs: TimeLog[];

  @OneToMany(() => File, (file) => file.task)
  files: File[];
}
