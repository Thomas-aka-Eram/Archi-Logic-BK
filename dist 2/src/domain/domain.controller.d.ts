import { DomainService } from './domain.service';
import { CreateDomainDto } from './dto/create-domain.dto';
export declare class DomainController {
    private readonly domainService;
    constructor(domainService: DomainService);
    create(createDomainDto: CreateDomainDto, req: any): Promise<{
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
