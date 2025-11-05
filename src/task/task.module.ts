import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { DrizzleModule } from '../db/drizzle.module';
import { ReviewModule } from '../review/review.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DrizzleModule, ReviewModule, ActivityModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
