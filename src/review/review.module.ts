import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { DrizzleModule } from '../db/drizzle.module';
import { TaskReviewController } from './task.review.controller';
import { TaskReviewService } from './task.review.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DrizzleModule, ActivityModule],
  controllers: [ReviewController, TaskReviewController],
  providers: [ReviewService, TaskReviewService],
  exports: [TaskReviewService],
})
export class ReviewModule {}
