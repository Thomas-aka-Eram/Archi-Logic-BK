import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @IsOptional()
  roleOnJoin?: string;
}
