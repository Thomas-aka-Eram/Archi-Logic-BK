import { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { ExtractTablesWithRelations } from 'drizzle-orm';
export declare const DB = "DB";
export type DbType = NodePgDatabase<typeof schema>;
export type TransactionType = NodePgTransaction<typeof schema, ExtractTablesWithRelations<typeof schema>>;
export declare class DrizzleModule {
}
