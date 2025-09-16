import { Module } from '@nestjs/common';
import {
  drizzle,
  NeonHttpDatabase,
  NeonHttpQueryResultHKT,
} from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { ExtractTablesWithRelations } from 'drizzle-orm';

export const DB = 'DB';
export type DbType = NeonHttpDatabase<typeof schema>;
export type TransactionType = PgTransaction<
  NeonHttpQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => {
        const sql = neon(process.env.DATABASE_URL!);
        return drizzle(sql, { schema });
      },
    },
  ],
  exports: [DB],
})
export class DrizzleModule {}
