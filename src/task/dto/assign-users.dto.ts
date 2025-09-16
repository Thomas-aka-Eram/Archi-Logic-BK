import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

class UserAssignmentDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}

export class AssignUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAssignmentDto)
  assignments: UserAssignmentDto[];
}
