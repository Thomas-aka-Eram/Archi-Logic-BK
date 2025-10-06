import type { DbType } from '../db/drizzle.module';
export declare class WebhookService {
    private readonly db;
    constructor(db: DbType);
    processPushEvent(payload: any): Promise<void>;
    private parseTaskIdsFromMessage;
    private linkTasksToCommit;
}
