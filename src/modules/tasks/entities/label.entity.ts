import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from '../../projects/entities/project.entity';
import { TaskLabel } from './task-label.entity';

@Entity('labels')
export class Label extends BaseEntity {
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 7 })
  color: string;

  // Relations
  @ManyToOne(() => Project, (project) => project.labels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => TaskLabel, (taskLabel) => taskLabel.label)
  taskLabels: TaskLabel[];
}
