import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Task } from './task.entity';
import { Label } from './label.entity';

@Entity('task_labels')
@Unique(['taskId', 'labelId'])
export class TaskLabel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'label_id' })
  labelId: string;

  // Relations
  @ManyToOne(() => Task, (task) => task.taskLabels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Label, (label) => label.taskLabels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'label_id' })
  label: Label;
}
