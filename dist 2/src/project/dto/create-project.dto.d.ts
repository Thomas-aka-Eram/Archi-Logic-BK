declare class ProjectPhaseDto {
    key: string;
    title: string;
    sortOrder: number;
}
export declare class CreateProjectDto {
    name: string;
    description?: string;
    phases?: ProjectPhaseDto[];
}
export {};
