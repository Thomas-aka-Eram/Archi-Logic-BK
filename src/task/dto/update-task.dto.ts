import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

class AssignmentDto {
  @IsUUID()
  userId: string;

  @IsString()
  role: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsInt()
  @IsOptional()
  estimateHours?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentDto)
  @IsOptional()
  assignees?: AssignmentDto[];

  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}
