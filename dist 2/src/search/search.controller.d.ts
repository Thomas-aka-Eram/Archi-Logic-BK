import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(query: string): Promise<{
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
