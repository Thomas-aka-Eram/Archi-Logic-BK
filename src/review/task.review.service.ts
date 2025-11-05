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
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class TaskReviewService {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly activityService: ActivityService,
  ) {}

  async getReviewQueue(userId: string) {
    const reviews = await this.db
      .select()
      .from(schema.taskReviews)
      .where(eq(schema.taskReviews.status, 'PENDING'))
      .leftJoin(schema.tasks, eq(schema.taskReviews.taskId, schema.tasks.id))
      .leftJoin(schema.users, eq(schema.taskReviews.requesterId, schema.users.id));

    return reviews.map(r => ({
        ...r.task_reviews,
        task: r.tasks,
        requester: r.users,
    }));
  }

  async getReviews(projectId: string, status: string) {
    const reviews = await this.db
      .select()
      .from(schema.taskReviews)
      .leftJoin(schema.tasks, eq(schema.taskReviews.taskId, schema.tasks.id))
      .leftJoin(schema.users, eq(schema.taskReviews.requesterId, schema.users.id))
      .where(
        and(
          eq(schema.tasks.projectId, projectId),
          status ? eq(schema.taskReviews.status, status) : undefined,
        ),
      );
    
    return reviews.map(r => ({
        ...r.task_reviews,
        task: r.tasks,
        requester: r.users,
    }));
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

    const task = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, review.taskId),
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.activityService.log({
      userId: reviewerId,
      projectId: task.projectId,
      action: 'ASSIGN_REVIEWER',
      entity: 'TASK',
      entityId: review.taskId,
      description: `Reviewer assigned to task`,
    });

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

    if (!review.reviewerId) {
      throw new BadRequestException('A reviewer must be assigned to approve.');
    }

    await this.db
      .update(schema.taskReviews)
      .set({ status: 'APPROVED', respondedAt: new Date() })
      .where(eq(schema.taskReviews.id, reviewId));

    await this.db
      .update(schema.tasks)
      .set({ status: 'APPROVED' })
      .where(eq(schema.tasks.id, review.taskId));

    const task = await this.db.query.tasks.findFirst({
      where: eq(schema.tasks.id, review.taskId),
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.activityService.log({
      userId: review.reviewerId,
      projectId: task.projectId,
      action: 'APPROVE_REVIEW',
      entity: 'TASK',
      entityId: review.taskId,
      description: `Review approved`,
    });

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

    await this.activityService.log({
      userId: review.reviewerId,
      projectId: task.projectId,
      action: 'REQUEST_CHANGES',
      entity: 'TASK',
      entityId: review.taskId,
      description: `Changes requested for task`,
      newValues: { comments },
    });

    return { status: 'ok' };
  }
}