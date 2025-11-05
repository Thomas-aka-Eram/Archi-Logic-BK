import { Injectable, Inject } from '@nestjs/common';
import { DB, type DbType } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { eq, and, gte, sql, lte } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async getDashboardSummary(userId: string, projectId: string) {
    const activeProjectsCount = await this.getActiveProjectsCount(userId);
    const taskStatusCounts = await this.getTaskStatusCounts(projectId);
    const pendingReviewsCount = await this.getPendingReviewsCount(projectId);
    const recentCommits = await this.getRecentCommits(projectId);
    const activityFeed = await this.getActivityFeed(projectId);
    const dueSoonTasks = await this.getDueSoonTasks(projectId);

    return {
      activeProjectsCount,
      taskStatusCounts,
      pendingReviewsCount,
      recentCommits,
      activityFeed,
      dueSoonTasks,
    };
  }

  private async getTaskStatusCounts(
    projectId: string,
  ): Promise<{ status: string; count: number }[]> {
    const result = await this.db
      .select({
        status: schema.tasks.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId))
      .groupBy(schema.tasks.status);

    return result.filter((r) => r.status) as { status: string; count: number }[];
  }

  private async getActiveProjectsCount(userId: string): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.projectUserRoles)
      .leftJoin(
        schema.projects,
        eq(schema.projectUserRoles.projectId, schema.projects.id),
      )
      .where(
        and(
          eq(schema.projectUserRoles.userId, userId),
          eq(schema.projects.isDeleted, false),
        ),
      );
    return result[0].count;
  }

  private async getPendingReviewsCount(projectId: string): Promise<number> {
    const result = await this.db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.taskReviews)
      .leftJoin(schema.tasks, eq(schema.taskReviews.taskId, schema.tasks.id))
      .where(
        and(
          eq(schema.tasks.projectId, projectId),
          eq(schema.taskReviews.status, 'PENDING'),
        ),
      );

    return result[0].count;
  }

  private async getRecentCommits(
    projectId: string,
  ): Promise<(typeof schema.commits.$inferSelect)[]> {
    const result = await this.db.query.commits.findMany({
      where: eq(schema.commits.projectId, projectId),
      orderBy: (commits, { desc }) => [desc(commits.committedAt)],
      limit: 5,
    });

    return result;
  }

  private async getActivityFeed(
    projectId: string,
  ): Promise<(typeof schema.activityLogs.$inferSelect)[]> {
    const result = await this.db.query.activityLogs.findMany({
      where: eq(schema.activityLogs.projectId, projectId),
      orderBy: (activityLogs, { desc }) => [desc(activityLogs.createdAt)],
      limit: 20,
    });

    return result;
  }

  private async getDueSoonTasks(
    projectId: string,
  ): Promise<(typeof schema.tasks.$inferSelect)[]> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const result = await this.db.query.tasks.findMany({
      where: and(
        eq(schema.tasks.projectId, projectId),
        gte(schema.tasks.dueDate, new Date()),
        lte(schema.tasks.dueDate, sevenDaysFromNow),
      ),
      orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
    });

    return result;
  }
}
