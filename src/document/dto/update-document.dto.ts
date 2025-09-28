import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
