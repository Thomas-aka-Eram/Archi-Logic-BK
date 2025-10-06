import type { DbType } from '../db/drizzle.module';
export declare class SearchService {
    private readonly db;
    constructor(db: DbType);
    searchBlocks(query: string): Promise<{
        id: string;
        blockGroupId: string;
        documentId: string;
        type: string;
        content: string;
        renderedHtml: string | null;
        status: string | null;
        version: number;
        parentVersionId: string | null;
        isCurrentVersion: boolean | null;
        blocksSearchVector: string | null;
        createdBy: string;
        createdAt: Date | null;
        orderIndex: number | null;
    }[]>;
}
