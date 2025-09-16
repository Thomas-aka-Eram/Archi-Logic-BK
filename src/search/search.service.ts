import { Injectable, Inject } from '@nestjs/common';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import { sql } from 'drizzle-orm';
import { blocks } from '../db/schema';

@Injectable()
export class SearchService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async searchBlocks(query: string) {
    const searchResults = await this.db
      .select()
      .from(blocks)
      .where(sql`search_vector @@ plainto_tsquery('english', ${query})`);

    return searchResults;
  }
}
