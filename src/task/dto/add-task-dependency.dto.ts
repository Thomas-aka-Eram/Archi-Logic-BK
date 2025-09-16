import { IsString, IsUUID, IsOptional } from 'class-validator';

export class AddTaskDependencyDto {
  @IsUUID()
  dependsOnTaskId: string;

  @IsString()
  @IsOptional()
  dependencyType?: string;
}
