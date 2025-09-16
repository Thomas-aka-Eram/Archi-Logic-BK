import { IsUUID, IsString } from 'class-validator';

export class AssignUserDto {
  @IsUUID()
  userId: string;

  @IsString()
  role: string;
}
