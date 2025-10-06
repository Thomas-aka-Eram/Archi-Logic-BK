import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class GetUnassignedTasksDto {
  @IsString()
  @IsOptional()
  phaseId?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tagIds?: string[];
}
