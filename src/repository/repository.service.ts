import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { AddRepositoryDto } from './dto/add-repository.dto';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class RepositoryService {
  constructor(@Inject(DB) private db: DbType) {}

  async addRepository(
    projectId: string,
    addRepositoryDto: AddRepositoryDto,
    actorUserId: string,
  ) {
    const { name, webhookSecret } = addRepositoryDto;

    return this.db.transaction(async (tx) => {
      // Optional: Check for MANAGE_SETTINGS permission
      // const [actorMembership] = await tx.select().from(schema.userProjects)...

      const [newRepository] = await tx
        .insert(schema.repositories)
        .values({
          projectId,
          name,
          webhookSecret,
        })
        .returning();

      // TODO: Add activity log

      return newRepository;
    });
  }
}
