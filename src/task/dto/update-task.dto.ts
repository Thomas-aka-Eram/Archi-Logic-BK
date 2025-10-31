import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { taskStatusEnum } from '../../db/schema';

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

  @IsOptional()
  @IsIn(taskStatusEnum.enumValues)
  status?: (typeof taskStatusEnum.enumValues)[number];

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

  @IsInt()
  @IsOptional()
  actualHours?: number;

  @IsString()
  @IsOptional()
  completionNotes?: string;

  @IsString()
  @IsOptional()
  commitId?: string;
}
