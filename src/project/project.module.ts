import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { DrizzleModule } from '../db/drizzle.module';

import { DocumentModule } from '../document/document.module';

@Module({
  imports: [DrizzleModule, DocumentModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
