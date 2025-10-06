import type { DbType } from '../db/drizzle.module';
import { AddRepositoryDto } from './dto/add-repository.dto';
export declare class RepositoryService {
    private db;
    constructor(db: DbType);
    addRepository(projectId: string, addRepositoryDto: AddRepositoryDto, actorUserId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        projectId: string;
        isActive: boolean | null;
        webhookSecret: string | null;
    }>;
}
