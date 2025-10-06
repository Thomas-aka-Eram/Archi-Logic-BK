import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { DocumentService } from '../document/document.service';
import { CreateDocumentDto } from '../document/dto/create-document.dto';
export declare class ProjectController {
    private readonly projectService;
    private readonly documentService;
    constructor(projectService: ProjectService, documentService: DocumentService);
    createDocument(req: any, projectId: string, createDocumentDto: CreateDocumentDto): Promise<{
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
    getDocumentsForProject(projectId: string, phaseKey?: string): Promise<{
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
    }[]>;
    getProjects(req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        description: string | null;
        createdBy: string;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
    }[]>;
    createProject(createProjectDto: CreateProjectDto, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        description: string | null;
        createdBy: string;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
        phases: {
            id: string;
            createdAt: Date | null;
            projectId: string;
            key: string;
            title: string;
            sortOrder: number | null;
            isActive: boolean | null;
        }[];
    } | undefined>;
    getProjectMembers(projectId: string): Promise<{
        id: string;
        role: string | null;
        createdAt: Date | null;
        userId: string;
        projectId: string;
        permissions: string[] | null;
        user: {
            id: string;
            name: string | null;
            email: string;
        };
    }[]>;
    addProjectMember(projectId: string, addProjectMemberDto: AddProjectMemberDto): Promise<{
        id: string;
        role: string | null;
        createdAt: Date | null;
        userId: string;
        projectId: string;
        permissions: string[] | null;
    }>;
    updateMemberRole(req: any, projectId: string, targetUserId: string, updateMemberRoleDto: UpdateMemberRoleDto): Promise<{
        id: string;
        userId: string;
        projectId: string;
        role: string | null;
        permissions: string[] | null;
        createdAt: Date | null;
    }>;
    getProjectPhases(projectId: string): Promise<{
        id: string;
        createdAt: Date | null;
        projectId: string;
        key: string;
        title: string;
        sortOrder: number | null;
        isActive: boolean | null;
    }[]>;
    getProjectById(projectId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        description: string | null;
        createdBy: string;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
        userProjects: {
            id: string;
            role: string | null;
            createdAt: Date | null;
            userId: string;
            projectId: string;
            permissions: string[] | null;
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        }[];
        phases: {
            id: string;
            createdAt: Date | null;
            projectId: string;
            key: string;
            title: string;
            sortOrder: number | null;
            isActive: boolean | null;
        }[];
    }>;
}
