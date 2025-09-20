import { Module } from '@nestjs/common';
import { drizzle, NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ExtractTablesWithRelations } from 'drizzle-orm';

export const DB = 'DB';
export type DbType = NodePgDatabase<typeof schema>;
export type TransactionType = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: true,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB],
})
export class DrizzleModule {}
