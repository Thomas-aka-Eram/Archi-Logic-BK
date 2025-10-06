import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { GetAssignmentSuggestionsDto } from './dto/get-assignment-suggestions.dto';
export declare class TaskController {
    private readonly taskService;
    constructor(taskService: TaskService);
    getAssignmentSuggestions(getAssignmentSuggestionsDto: GetAssignmentSuggestionsDto): Promise<{
        user: {
            id: string;
            name: string | null;
            email: string;
            passwordHash: string | null;
            role: string | null;
            createdAt: Date | null;
        };
        score: number;
        details: {
            skillMatch: string;
            availability: string;
            reliability: string;
        };
    }[]>;
    createTask(projectId: string, createTaskDto: CreateTaskDto, req: any): Promise<{
        id: string;
        createdAt: Date | null;
        description: string | null;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
        projectId: string;
        title: string;
        status: string | null;
        priority: string | null;
        dueDate: Date | null;
        estimateHours: number | null;
        tags: {
            id: string;
            createdAt: Date | null;
            tagId: string;
            taskId: string;
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
        assignees: {
            id: string;
            role: string | null;
            createdAt: Date | null;
            userId: string;
            taskId: string;
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        }[];
    } | undefined>;
    getTasksForProject(projectId: string): Promise<{
        id: string;
        createdAt: Date | null;
        description: string | null;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
        projectId: string;
        title: string;
        status: string | null;
        priority: string | null;
        dueDate: Date | null;
        estimateHours: number | null;
        tags: {
            id: string;
            createdAt: Date | null;
            tagId: string;
            taskId: string;
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
        assignees: {
            id: string;
            role: string | null;
            createdAt: Date | null;
            userId: string;
            taskId: string;
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        }[];
    }[]>;
    getTaskById(taskId: string): Promise<{
        id: string;
        createdAt: Date | null;
        description: string | null;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
        projectId: string;
        title: string;
        status: string | null;
        priority: string | null;
        dueDate: Date | null;
        estimateHours: number | null;
        tags: {
            id: string;
            createdAt: Date | null;
            tagId: string;
            taskId: string;
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
        assignees: {
            id: string;
            role: string | null;
            createdAt: Date | null;
            userId: string;
            taskId: string;
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        }[];
    }>;
    updateTask(taskId: string, updateTaskDto: UpdateTaskDto, req: any): Promise<{
        id: string;
        createdAt: Date | null;
        description: string | null;
        updatedAt: Date | null;
        isDeleted: boolean | null;
        deletedAt: Date | null;
        projectId: string;
        title: string;
        status: string | null;
        priority: string | null;
        dueDate: Date | null;
        estimateHours: number | null;
        tags: {
            id: string;
            createdAt: Date | null;
            tagId: string;
            taskId: string;
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
        assignees: {
            id: string;
            role: string | null;
            createdAt: Date | null;
            userId: string;
            taskId: string;
            user: {
                id: string;
                name: string | null;
                email: string;
            };
        }[];
    } | undefined>;
    assignMultipleUsers(taskId: string, assignUsersDto: AssignUsersDto): Promise<void>;
    addTaskDependency(taskId: string, addTaskDependencyDto: AddTaskDependencyDto): Promise<{
        id: string;
        createdAt: Date | null;
        taskId: string;
        dependsOnTaskId: string;
        dependencyType: string | null;
    }>;
}
