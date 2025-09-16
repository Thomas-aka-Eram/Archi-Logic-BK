import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProjectPhaseDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  sortOrder: number;
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProjectPhaseDto)
  phases?: ProjectPhaseDto[];
}
