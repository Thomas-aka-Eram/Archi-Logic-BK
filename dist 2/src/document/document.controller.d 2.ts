import { DocumentService } from './document.service';
import { AddBlockDto } from './dto/add-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';
import { AssignDomainDto } from './dto/assign-domain.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    updateDocument(docId: string, updateDocumentDto: UpdateDocumentDto): Promise<{
        id: string;
        projectId: string;
        title: string;
        phaseId: string | null;
        domainId: string | null;
        createdBy: string;
        createdAt: Date | null;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
    }>;
    getDocument(docId: string): Promise<{
        id: string;
        createdAt: Date | null;
        createdBy: string;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
        projectId: string;
        title: string;
        phaseId: string | null;
        domainId: string | null;
    }>;
    deleteDocument(docId: string): Promise<{
        message: string;
    }>;
    getDocumentBlocks(docId: string, currentOnly?: string): Promise<{
        id: string;
        createdAt: Date | null;
        createdBy: string;
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
        orderIndex: number | null;
        domains: {
            id: string;
            domainId: string;
            blockId: string;
            domain: {
                id: string;
                createdAt: Date | null;
                createdBy: string;
                projectId: string;
                key: string;
                title: string;
            };
        }[];
        tags: {
            id: string;
            createdAt: Date | null;
            blockId: string;
            tagId: string;
            tag: {
                id: string;
                name: string;
                createdAt: Date | null;
                description: string | null;
                createdBy: string;
                projectId: string;
                slug: string;
                parentId: string | null;
                level: number | null;
                color: string | null;
                phase: string | null;
                usageCount: number | null;
                isArchived: boolean | null;
            };
        }[];
    }[]>;
    addBlock(docId: string, addBlockDto: AddBlockDto, req: any): Promise<{
        id: string;
        createdAt: Date | null;
        createdBy: string;
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
        orderIndex: number | null;
        domains: {
            id: string;
            domainId: string;
            blockId: string;
            domain: {
                id: string;
                createdAt: Date | null;
                createdBy: string;
                projectId: string;
                key: string;
                title: string;
            };
        }[];
        tags: {
            id: string;
            createdAt: Date | null;
            blockId: string;
            tagId: string;
            tag: {
                id: string;
                name: string;
                createdAt: Date | null;
                description: string | null;
                createdBy: string;
                projectId: string;
                slug: string;
                parentId: string | null;
                level: number | null;
                color: string | null;
                phase: string | null;
                usageCount: number | null;
                isArchived: boolean | null;
            };
        }[];
    } | undefined>;
    updateBlock(blockGroupId: string, updateBlockDto: UpdateBlockDto, req: any): Promise<{
        id: string;
        createdAt: Date | null;
        createdBy: string;
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
        orderIndex: number | null;
        domains: {
            id: string;
            domainId: string;
            blockId: string;
            domain: {
                id: string;
                createdAt: Date | null;
                createdBy: string;
                projectId: string;
                key: string;
                title: string;
            };
        }[];
        tags: {
            id: string;
            createdAt: Date | null;
            blockId: string;
            tagId: string;
            tag: {
                id: string;
                name: string;
                createdAt: Date | null;
                description: string | null;
                createdBy: string;
                projectId: string;
                slug: string;
                parentId: string | null;
                level: number | null;
                color: string | null;
                phase: string | null;
                usageCount: number | null;
                isArchived: boolean | null;
            };
        }[];
    } | undefined>;
    assignTagsToBlock(blockGroupId: string, assignTagsDto: AssignTagsDto): Promise<{
        id: string;
        createdAt: Date | null;
        createdBy: string;
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
        orderIndex: number | null;
        domains: {
            id: string;
            domainId: string;
            blockId: string;
            domain: {
                id: string;
                createdAt: Date | null;
                createdBy: string;
                projectId: string;
                key: string;
                title: string;
            };
        }[];
        tags: {
            id: string;
            createdAt: Date | null;
            blockId: string;
            tagId: string;
            tag: {
                id: string;
                name: string;
                createdAt: Date | null;
                description: string | null;
                createdBy: string;
                projectId: string;
                slug: string;
                parentId: string | null;
                level: number | null;
                color: string | null;
                phase: string | null;
                usageCount: number | null;
                isArchived: boolean | null;
            };
        }[];
    } | undefined>;
    assignDomainToBlock(blockGroupId: string, assignDomainDto: AssignDomainDto): Promise<{
        id: string;
        createdAt: Date | null;
        createdBy: string;
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
        orderIndex: number | null;
        domains: {
            id: string;
            domainId: string;
            blockId: string;
            domain: {
                id: string;
                createdAt: Date | null;
                createdBy: string;
                projectId: string;
                key: string;
                title: string;
            };
        }[];
        tags: {
            id: string;
            createdAt: Date | null;
            blockId: string;
            tagId: string;
            tag: {
                id: string;
                name: string;
                createdAt: Date | null;
                description: string | null;
                createdBy: string;
                projectId: string;
                slug: string;
                parentId: string | null;
                level: number | null;
                color: string | null;
                phase: string | null;
                usageCount: number | null;
                isArchived: boolean | null;
            };
        }[];
    } | undefined>;
}
