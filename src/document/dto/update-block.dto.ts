import { IsString, IsArray, IsUUID, IsOptional, IsInt } from 'class-validator';

export class UpdateBlockDto {
  @IsString()
  content: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  domains?: string[];

  @IsInt()
  @IsOptional()
  expectedVersion?: number;
}
