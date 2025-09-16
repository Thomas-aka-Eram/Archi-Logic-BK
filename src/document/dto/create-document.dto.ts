import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsUUID()
  phaseId: string;

  @IsUUID()
  @IsOptional()
  domainId?: string;
}
