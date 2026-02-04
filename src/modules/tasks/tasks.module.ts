import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController, LabelsController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { Label } from './entities/label.entity';
import { TaskLabel } from './entities/task-label.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskAssignee, Label, TaskLabel]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => ActivityLogsModule),
  ],
  controllers: [TasksController, LabelsController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
