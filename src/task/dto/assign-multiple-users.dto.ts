import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class TaskAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  role?: string;
}

export class AssignMultipleUsersDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskAssignmentDto)
  @IsNotEmpty()
  assignments: TaskAssignmentDto[];
}
