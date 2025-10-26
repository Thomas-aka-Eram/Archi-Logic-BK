import { IsUUID, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FindRelatedDocumentsDto {
  @IsUUID()
  domainId: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @Type(() => String)
  tagIds?: string[];
}
