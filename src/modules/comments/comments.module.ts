import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Task]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => ActivityLogsModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
