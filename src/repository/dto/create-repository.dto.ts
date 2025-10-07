
import { IsString, IsUUID } from 'class-validator';

export class CreateRepositoryDto {
  @IsUUID()
  projectId: string;

  @IsString()
  name: string;

  @IsString()
  accessToken: string;
}
