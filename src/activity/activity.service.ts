import { Injectable, Inject } from '@nestjs/common';
import { DB } from '../db/drizzle.module';
import type { DbType } from '../db/drizzle.module';
import * as schema from '../db/schema';

interface LogParams {
  userId: string;
  projectId: string;
  action: string;
  entity: string;
  entityId: string;
  description?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async log(params: LogParams) {
    await this.db.insert(schema.activityLogs).values(params);
  }
}
