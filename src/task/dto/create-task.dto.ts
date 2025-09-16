import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class TaskAssigneeDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsOptional()
  estimateHours?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeDto)
  assignees?: TaskAssigneeDto[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  dependencies?: string[];
}
