import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { DB } from '../db/drizzle.module';
import type { DbType } from '../db/drizzle.module';
import { domains } from '../db/schema';
import { CreateDomainDto } from './dto/create-domain.dto';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class DomainService {
  constructor(@Inject(DB) private db: DbType) {}

  async create(createDomainDto: CreateDomainDto, userId: string) {
    const { name, projectId } = createDomainDto;
    const key = name.toUpperCase().replace(/\s+/g, '_');

    const existing = await this.db.query.domains.findFirst({
      where: and(eq(domains.projectId, projectId), eq(domains.key, key)),
    });

    if (existing) {
      throw new ConflictException('A domain with this name already exists for this project.');
    }

    const [newDomain] = await this.db
      .insert(domains)
      .values({
        key,
        title: name,
        projectId,
        createdBy: userId,
      })
      .returning();

    return newDomain;
  }

  async findAll(projectId: string) {
    return this.db.select().from(domains).where(eq(domains.projectId, projectId));
  }
}