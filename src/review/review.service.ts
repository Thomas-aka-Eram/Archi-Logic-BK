import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { RequestReviewDto } from './dto/request-review.dto';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ReviewService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async requestReview(
    blockGroupId: string,
    requestReviewDto: RequestReviewDto,
    requesterId: string,
  ) {
    const { reviewerId } = requestReviewDto;

    const [currentBlock] = await this.db
      .select()
      .from(schema.blocks)
      .where(
        and(
          eq(schema.blocks.blockGroupId, blockGroupId),
          eq(schema.blocks.isCurrentVersion, true),
        ),
      );

    if (!currentBlock) {
      throw new NotFoundException('Block not found.');
    }

    const [reviewRequest] = await this.db
      .insert(schema.reviewRequests)
      .values({
        blockId: currentBlock.id,
        reviewerId,
        // requesterId, // TODO: Add requesterId to schema
      })
      .returning();

    // TODO: Add notification for the reviewer

    return reviewRequest;
  }

  async approveReview(reviewId: string, reviewerId: string) {
    const [reviewRequest] = await this.db
      .select()
      .from(schema.reviewRequests)
      .where(eq(schema.reviewRequests.id, reviewId));

    if (!reviewRequest) {
      throw new NotFoundException('Review request not found.');
    }

    if (reviewRequest.reviewerId !== reviewerId) {
      throw new UnauthorizedException(
        'You are not the reviewer for this request.',
      );
    }

    await this.db
      .update(schema.reviewRequests)
      .set({ status: 'APPROVED', respondedAt: new Date() })
      .where(eq(schema.reviewRequests.id, reviewId));

    await this.db
      .update(schema.blocks)
      .set({ status: 'APPROVED' })
      .where(eq(schema.blocks.id, reviewRequest.blockId));

    // TODO: Add activity log

    return { status: 'ok' };
  }

  async requestChanges(reviewId: string, message: string, reviewerId: string) {
    const [reviewRequest] = await this.db
      .select()
      .from(schema.reviewRequests)
      .where(eq(schema.reviewRequests.id, reviewId));

    if (!reviewRequest) {
      throw new NotFoundException('Review request not found.');
    }

    if (reviewRequest.reviewerId !== reviewerId) {
      throw new UnauthorizedException(
        'You are not the reviewer for this request.',
      );
    }

    await this.db
      .update(schema.reviewRequests)
      .set({ status: 'CHANGES_REQUESTED', respondedAt: new Date() })
      .where(eq(schema.reviewRequests.id, reviewId));

    // TODO: Add notification for the original requester
    // TODO: Add comment with the message

    return { status: 'ok' };
  }
}
