import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Role } from '../roles/entities/role.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, Role]),
    forwardRef(() => ActivityLogsModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
