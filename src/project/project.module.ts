import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { DrizzleModule } from '../db/drizzle.module';
import { DocumentModule } from '../document/document.module';
import { RepositoryModule } from '../repository/repository.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DrizzleModule, DocumentModule, RepositoryModule, ActivityModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
