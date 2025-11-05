import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DrizzleModule } from '../db/drizzle.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DrizzleModule, ActivityModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
