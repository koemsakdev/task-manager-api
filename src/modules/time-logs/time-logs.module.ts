import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeLogsService } from './time-logs.service';
import { TimeLogsController } from './time-logs.controller';
import { TimeLog } from './entities/time-log.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeLog, Task]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => ActivityLogsModule),
  ],
  controllers: [TimeLogsController],
  providers: [TimeLogsService],
  exports: [TimeLogsService],
})
export class TimeLogsModule {}
