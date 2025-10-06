import type { DbType } from '../db/drizzle.module';
import { CreateTagDto } from './dto/create-tag.dto';
export declare class TagService {
    private db;
    constructor(db: DbType);
    private getParentLevel;
    private getInheritedColor;
    create(createTagDto: CreateTagDto, userId: string): Promise<{
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
    }>;
    findAll(projectId: string): Promise<{
        children: string[];
        id: string;
        projectId: string;
        name: string;
        slug: string;
        parentId: string | null;
        level: number | null;
        color: string | null;
        phase: string | null;
        description: string | null;
        usageCount: number | null;
        isArchived: boolean | null;
        createdBy: string;
        createdAt: Date | null;
    }[]>;
}
