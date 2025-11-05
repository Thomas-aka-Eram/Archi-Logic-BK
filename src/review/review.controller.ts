import {
  Controller,
  Post,
  Body,
  Param,
  ValidationPipe,
  Request,
  ParseUUIDPipe,
  UseGuards,
  Get,
} from '@nestjs/common';
import { TaskReviewService } from './task.review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly taskReviewService: TaskReviewService) {}

  @Get('queue')
  async getReviewQueue(@Request() req) {
    return this.taskReviewService.getReviewQueue(req.user.id);
  }

  @Get('project/:projectId')
  async getReviews(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('status') status: string,
  ) {
    return this.taskReviewService.getReviews(projectId, status);
  }

  @Post(':reviewId/approve')
  async approveTaskReview(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    return this.taskReviewService.approveReview(reviewId);
  }

  @Post(':reviewId/request-changes')
  async requestTaskChanges(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body('comments') comments: string,
  ) {
    return this.taskReviewService.requestChanges(reviewId, comments);
  }

  @Post(':reviewId/assign')
  async assignReviewer(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body('reviewerId') reviewerId: string,
  ) {
    return this.taskReviewService.assignReviewer(reviewId, reviewerId);
  }
}