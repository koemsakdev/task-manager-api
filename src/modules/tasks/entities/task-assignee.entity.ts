import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from '../../users/entities/user.entity';

@Entity('task_assignees')
@Unique(['taskId', 'userId'])
export class TaskAssignee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  // Relations
  @ManyToOne(() => Task, (task) => task.assignees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, (user) => user.taskAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
