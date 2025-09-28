import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class GetAssignmentSuggestionsDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsArray()
  @IsOptional()
  tagIds: string[];
}