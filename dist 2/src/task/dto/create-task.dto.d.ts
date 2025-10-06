declare class TaskAssigneeDto {
    userId: string;
    role: string;
}
export declare class CreateTaskDto {
    title: string;
    description?: string;
    tags?: string[];
    estimateHours?: number;
    dueDate?: string;
    assignees?: TaskAssigneeDto[];
    dependencies?: string[];
}
export {};
