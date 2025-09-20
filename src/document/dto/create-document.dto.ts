import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsString()
  phaseKey: string;

  @IsUUID()
  @IsOptional()
  domainId?: string;
}
