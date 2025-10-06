import type { DbType } from '../db/drizzle.module';
import { CreateDomainDto } from './dto/create-domain.dto';
export declare class DomainService {
    private db;
    constructor(db: DbType);
    create(createDomainDto: CreateDomainDto, userId: string, projectId: string): Promise<{
        id: string;
        createdAt: Date | null;
        createdBy: string;
        projectId: string;
        key: string;
        title: string;
    }>;
    findAll(projectId: string): Promise<{
        id: string;
        projectId: string;
        key: string;
        title: string;
        createdBy: string;
        createdAt: Date | null;
    }[]>;
}
