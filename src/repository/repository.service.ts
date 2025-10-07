
import { Inject, Injectable } from '@nestjs/common';
import { DB, type DbType } from '../db/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { repositories } from '../db/schema';
import { CreateRepositoryDto } from './dto/create-repository.dto';

@Injectable()
export class RepositoryService {
  constructor(@Inject(DB) private db: DbType) {}

  async addRepository(
    projectId: string,
    createRepositoryDto: CreateRepositoryDto,
    userId: string,
  ) {
    const [newRepository] = await this.db
      .insert(repositories)
      .values(createRepositoryDto)
      .returning();
    return newRepository;
  }

  async findByProjectId(projectId: string) {
    return this.db
      .select()
      .from(repositories)
      .where(eq(repositories.projectId, projectId));
  }

  async findById(id: string) {
    const [repo] = await this.db
      .select()
      .from(repositories)
      .where(eq(repositories.id, id));
    return repo;
  }

  async findByRepoName(name: string) {
    const [repo] = await this.db
      .select()
      .from(repositories)
      .where(eq(repositories.name, name));
    return repo;
  }

  async findByProjectIdAndName(projectId: string, name: string) {
    return this.db
      .select()
      .from(repositories)
      .where(
        and(eq(repositories.projectId, projectId), eq(repositories.name, name)),
      );
  }

  async updateAccessToken(id: string, accessToken: string) {
    const [updatedRepository] = await this.db
      .update(repositories)
      .set({ accessToken })
      .where(eq(repositories.id, id))
      .returning();
    return updatedRepository;
  }

  async updateWebhookEvents(id: string, events: string[]) {
    const [updatedRepository] = await this.db
      .update(repositories)
      .set({ webhookEvents: events })
      .where(eq(repositories.id, id))
      .returning();
    return updatedRepository;
  }

  async updateWebhookSecret(id: string, secret: string) {
    const [updatedRepository] = await this.db
      .update(repositories)
      .set({ webhookSecret: secret })
      .where(eq(repositories.id, id))
      .returning();
    return updatedRepository;
  }
}
