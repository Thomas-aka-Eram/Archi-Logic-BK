import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class GetAssignmentSuggestionsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  tagIds: string[];
}
