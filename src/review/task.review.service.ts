import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class TaskReviewService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async getReviews(projectId: string, status: string) {
    const reviews = await this.db
      .select()
      .from(schema.taskReviews)
      .leftJoin(schema.tasks, eq(schema.taskReviews.taskId, schema.tasks.id))
      .where(
        and(
          eq(schema.tasks.projectId, projectId),
          status ? eq(schema.taskReviews.status, status) : undefined,
        ),
      );
    return reviews;
  }

  async assignReviewer(reviewId: string, reviewerId: string) {
    const [review] = await this.db
      .select()
      .from(schema.taskReviews)
      .where(eq(schema.taskReviews.id, reviewId));

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    const [updatedReview] = await this.db
      .update(schema.taskReviews)
      .set({ reviewerId })
      .where(eq(schema.taskReviews.id, reviewId))
      .returning();

    // TODO: Add activity log and notification

    return updatedReview;
  }

  async approveReview(reviewId: string) {
    const [review] = await this.db
      .select()
      .from(schema.taskReviews)
      .where(eq(schema.taskReviews.id, reviewId));

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    await this.db
      .update(schema.taskReviews)
      .set({ status: 'APPROVED', respondedAt: new Date() })
      .where(eq(schema.taskReviews.id, reviewId));

    await this.db
      .update(schema.tasks)
      .set({ status: 'APPROVED' })
      .where(eq(schema.tasks.id, review.taskId));

    // TODO: Add activity log and notification

    return { status: 'ok' };
  }

  async requestChanges(reviewId: string, comments: string) {
    const [review] = await this.db
      .select()
      .from(schema.taskReviews)
      .where(eq(schema.taskReviews.id, reviewId));

    if (!review) {
      throw new NotFoundException('Review not found.');
    }

    if (!review.reviewerId) {
      throw new BadRequestException(
        'A reviewer must be assigned to request changes.',
      );
    }

    const [task] = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, review.taskId));

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.db
      .update(schema.taskReviews)
      .set({ status: 'CHANGES_REQUESTED', respondedAt: new Date() })
      .where(eq(schema.taskReviews.id, reviewId));

    await this.db
      .update(schema.tasks)
      .set({ status: 'REWORK_REQUESTED' })
      .where(eq(schema.tasks.id, review.taskId));

    await this.db.insert(schema.feedback).values({
      userId: review.reviewerId,
      projectId: task.projectId,
      taskId: review.taskId,
      comments,
    });

    // TODO: Add activity log and notification

    return { status: 'ok' };
  }
}
