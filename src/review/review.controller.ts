import {
  Controller,
  Post,
  Body,
  Param,
  ValidationPipe,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { RequestReviewDto } from './dto/request-review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('/block/:blockGroupId/request')
  async requestReview(
    @Param('blockGroupId', ParseUUIDPipe) blockGroupId: string,
    @Body(new ValidationPipe()) requestReviewDto: RequestReviewDto,
    @Request() req,
  ) {
    // const userId = req.user.id;
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    return this.reviewService.requestReview(
      blockGroupId,
      requestReviewDto,
      mockUserId,
    );
  }

  @Post(':reviewId/approve')
  async approveReview(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Request() req,
  ) {
    // const userId = req.user.id;
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    return this.reviewService.approveReview(reviewId, mockUserId);
  }

  @Post(':reviewId/request-changes')
  async requestChanges(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body('message') message: string,
    @Request() req,
  ) {
    // const userId = req.user.id;
    const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    return this.reviewService.requestChanges(reviewId, message, mockUserId);
  }
}
