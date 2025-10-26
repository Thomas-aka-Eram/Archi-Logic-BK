import { Inject, Injectable } from '@nestjs/common';
import { DB, type DbType } from '../db/drizzle.module';
import { commits } from '../db/schema';
import { CreateCommitDto } from './dto/create-commit.dto';

@Injectable()
export class CommitService {
  constructor(@Inject(DB) private db: DbType) {}

  async create(createCommitDto: CreateCommitDto) {
    const [newCommit] = await this.db
      .insert(commits)
      .values(createCommitDto)
      .returning();
    return newCommit;
  }
}
