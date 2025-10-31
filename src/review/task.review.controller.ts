import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { TaskReviewService } from './task.review.service';

@Controller('projects/:projectId/reviews')
export class TaskReviewController {
  constructor(private readonly taskReviewService: TaskReviewService) {}

  @Get()
  async getReviews(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('status') status: string,
  ) {
    return this.taskReviewService.getReviews(projectId, status);
  }

  @Patch(':reviewId/assign')
  async assignReviewer(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body('reviewerId', ParseUUIDPipe) reviewerId: string,
  ) {
    return this.taskReviewService.assignReviewer(reviewId, reviewerId);
  }

  @Post(':reviewId/approve')
  async approveReview(@Param('reviewId', ParseUUIDPipe) reviewId: string) {
    return this.taskReviewService.approveReview(reviewId);
  }

  @Post(':reviewId/request-changes')
  async requestChanges(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body('comments') comments: string,
  ) {
    return this.taskReviewService.requestChanges(reviewId, comments);
  }
}
