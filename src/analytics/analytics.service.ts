import { Injectable, Inject } from '@nestjs/common';
import { DB, type DbType } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

interface PhaseProgress {
  phase: string;
  completed: number;
  total: number;
}

interface DomainProductivity {
  domain: string;
  tasks: number;
  documents: number;
}

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async getProjectAnalytics(projectId: string) {
    const taskStatusDistribution =
      await this.getTaskStatusDistribution(projectId);
    const phaseProgress = await this.getPhaseProgress(projectId);
    const domainProductivity = await this.getDomainProductivity(projectId);
    const codeTraceability = await this.getCodeTraceability(projectId);
    const reviewQuality = await this.getReviewQuality(projectId);
    const activityVolume = await this.getActivityVolume(projectId);

    return {
      taskStatusDistribution,
      phaseProgress,
      domainProductivity,
      codeTraceability,
      reviewQuality,
      activityVolume,
    };
  }

  private async getTaskStatusDistribution(
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

  private async getPhaseProgress(
    projectId: string,
  ): Promise<{ phase: string; completed: number; total: number }[]> {
    const tasksByPhase = await this.db
      .select({
        phaseId: schema.tasks.phaseId,
        status: schema.tasks.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId))
      .groupBy(schema.tasks.phaseId, schema.tasks.status);

    const phaseProgress = tasksByPhase.reduce(
      (acc: Record<string, PhaseProgress>, row) => {
        if (!row.phaseId) return acc;
        const phase = acc[row.phaseId] || {
          phase: row.phaseId,
          completed: 0,
          total: 0,
        };
        if (row.status === 'COMPLETED') {
          phase.completed += row.count;
        }
        phase.total += row.count;
        acc[row.phaseId] = phase;
        return acc;
      },
      {},
    );

    return Object.values(phaseProgress);
  }

  private async getDomainProductivity(
    projectId: string,
  ): Promise<{ domain: string; tasks: number; documents: number }[]> {
    const tasksPerDomain = await this.db
      .select({
        domainId: schema.tasks.domainId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId))
      .groupBy(schema.tasks.domainId);

    const docsPerDomain = await this.db
      .select({
        domainId: schema.documents.domainId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.documents)
      .where(eq(schema.documents.projectId, projectId))
      .groupBy(schema.documents.domainId);

    const domainProductivity: Record<string, DomainProductivity> = {};

    tasksPerDomain.forEach((row) => {
      if (!row.domainId) return;
      const domain = domainProductivity[row.domainId] || {
        domain: row.domainId,
        tasks: 0,
        documents: 0,
      };
      domain.tasks = row.count;
      domainProductivity[row.domainId] = domain;
    });

    docsPerDomain.forEach((row) => {
      if (!row.domainId) return;
      const domain = domainProductivity[row.domainId] || {
        domain: row.domainId,
        tasks: 0,
        documents: 0,
      };
      domain.documents = row.count;
      domainProductivity[row.domainId] = domain;
    });

    return Object.values(domainProductivity);
  }

  private async getCodeTraceability(
    projectId: string,
  ): Promise<{ tasksWithCommits: number; totalTasks: number }> {
    const tasksWithCommits = await this.db
      .select({
        taskId: schema.taskCommits.taskId,
      })
      .from(schema.taskCommits)
      .leftJoin(schema.tasks, eq(schema.taskCommits.taskId, schema.tasks.id))
      .where(eq(schema.tasks.projectId, projectId))
      .groupBy(schema.taskCommits.taskId);

    const totalTasks = await this.db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId));

    return {
      tasksWithCommits: tasksWithCommits.length,
      totalTasks: totalTasks[0].count,
    };
  }

  private async getReviewQuality(
    projectId: string,
  ): Promise<{ approved: number; changesRequested: number }> {
    const blockReviews = await this.db
      .select({
        status: schema.reviewRequests.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.reviewRequests)
      .leftJoin(
        schema.blocks,
        eq(schema.reviewRequests.blockId, schema.blocks.id),
      )
      .leftJoin(
        schema.documents,
        eq(schema.blocks.documentId, schema.documents.id),
      )
      .where(eq(schema.documents.projectId, projectId))
      .groupBy(schema.reviewRequests.status);

    const taskReviews = await this.db
      .select({
        status: schema.taskReviews.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.taskReviews)
      .leftJoin(schema.tasks, eq(schema.taskReviews.taskId, schema.tasks.id))
      .where(eq(schema.tasks.projectId, projectId))
      .groupBy(schema.taskReviews.status);

    const reviewQuality = {
      approved: 0,
      changesRequested: 0,
    };

    blockReviews.forEach((row) => {
      if (row.status === 'APPROVED') {
        reviewQuality.approved += row.count;
      } else if (row.status === 'CHANGES_REQUESTED') {
        reviewQuality.changesRequested += row.count;
      }
    });

    taskReviews.forEach((row) => {
      if (row.status === 'APPROVED') {
        reviewQuality.approved += row.count;
      } else if (row.status === 'CHANGES_REQUESTED') {
        reviewQuality.changesRequested += row.count;
      }
    });

    return reviewQuality;
  }

  private async getActivityVolume(
    projectId: string,
  ): Promise<{ date: string; count: number }[]> {
    const result = await this.db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.projectId, projectId))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(desc(sql`DATE(created_at)`));

    return result;
  }
}
