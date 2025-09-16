import { Inject, Injectable } from '@nestjs/common';
import { DB, type DbType } from './db/drizzle.module';
import { users } from './db/schema';

@Injectable()
export class AppService {
  constructor(@Inject(DB) private db: DbType) {}

  async getUsers() {
    return this.db.select().from(users);
  }
}
