import { RepositoryService } from './repository.service';
import { AddRepositoryDto } from './dto/add-repository.dto';
export declare class RepositoryController {
    private readonly repositoryService;
    constructor(repositoryService: RepositoryService);
    addRepository(projectId: string, addRepositoryDto: AddRepositoryDto, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        projectId: string;
        isActive: boolean | null;
        webhookSecret: string | null;
    }>;
}
