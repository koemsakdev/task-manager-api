import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';

@Entity('time_logs')
export class TimeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'logged_at', type: 'date' })
  loggedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Task, (task) => task.timeLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, (user) => user.timeLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
