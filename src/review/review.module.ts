import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
