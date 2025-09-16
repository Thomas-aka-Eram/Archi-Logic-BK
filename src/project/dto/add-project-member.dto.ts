import { IsString, IsUUID, IsArray, IsOptional } from 'class-validator';

export class AddProjectMemberDto {
  @IsUUID()
  userId: string;

  @IsString()
  role: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
