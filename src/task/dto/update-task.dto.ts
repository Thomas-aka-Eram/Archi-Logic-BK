import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

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
}
