import type { DbType } from '../db/drizzle.module';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
export declare class ProjectService {
    private readonly db;
    constructor(db: DbType);
    createProject(createProjectDto: CreateProjectDto, userId: string): Promise<{
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
    addProjectMember(projectId: string, addProjectMemberDto: AddProjectMemberDto): Promise<{
        id: string;
        role: string | null;
        createdAt: Date | null;
        userId: string;
        projectId: string;
        permissions: string[] | null;
    }>;
    getProjectsForUser(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date | null;
        description: string | null;
        createdBy: string;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
    }[]>;
    getProjectPhases(projectId: string): Promise<{
        id: string;
        createdAt: Date | null;
        projectId: string;
        key: string;
        title: string;
        sortOrder: number | null;
        isActive: boolean | null;
    }[]>;
    updateMemberRole(requestingUserId: string, projectId: string, targetUserId: string, newRole: string): Promise<{
        id: string;
        userId: string;
        projectId: string;
        role: string | null;
        permissions: string[] | null;
        createdAt: Date | null;
    }>;
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
