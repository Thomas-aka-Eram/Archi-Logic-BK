declare class TaskAssignmentDto {
    userId: string;
    role?: string;
}
export declare class AssignMultipleUsersDto {
    taskId: string;
    assignments: TaskAssignmentDto[];
}
export {};
