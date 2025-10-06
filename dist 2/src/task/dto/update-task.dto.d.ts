declare class AssignmentDto {
    userId: string;
    role: string;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    estimateHours?: number;
    dueDate?: string;
    assignees?: AssignmentDto[];
}
export {};
