import { Injectable, Inject } from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class WebhookService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async processPushEvent(payload: any) {
    const { ref, commits, repository } = payload;
    const branch = ref.split('/').pop();
    const repoName = repository.full_name;

    const repo = await this.db.query.repositories.findFirst({
      where: eq(schema.repositories.name, repoName),
    });

    if (!repo) {
      // Or handle this as an error
      return;
    }

    const commitValues = commits.map((c) => ({
      repoId: repo.id,
      projectId: repo.projectId,
      commitHash: c.id,
      message: c.message,
      authorName: c.author.name,
      authorEmail: c.author.email,
      url: c.url,
      branch,
      committedAt: new Date(c.timestamp),
    }));

    if (commitValues.length > 0) {
      await this.db
        .insert(schema.commits)
        .values(commitValues)
        .onConflictDoNothing();
    }

    // Task linking logic
    for (const commit of commits) {
      const taskIds = this.parseTaskIdsFromMessage(commit.message);
      if (taskIds.length > 0) {
        const dbCommit = await this.db.query.commits.findFirst({
          where: eq(schema.commits.commitHash, commit.id),
        });
        if (dbCommit) {
          await this.linkTasksToCommit(taskIds, dbCommit.id);
        }
      }
    }
  }

  private parseTaskIdsFromMessage(message: string): string[] {
    const regex = /TASK-([0-9a-fA-F-]+)/g;
    const matches = message.match(regex);
    if (!matches) {
      return [];
    }
    return matches.map((m) => m.split('-')[1]);
  }

  private async linkTasksToCommit(taskIds: string[], commitId: string) {
    const taskCommitValues = taskIds.map((taskId) => ({
      taskId,
      commitId,
    }));

    if (taskCommitValues.length > 0) {
      await this.db
        .insert(schema.taskCommits)
        .values(taskCommitValues)
        .onConflictDoNothing();
    }
  }
}
