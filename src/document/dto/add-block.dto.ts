import { IsString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class AddBlockDto {
  @IsString()
  type: string;

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

  @IsString()
  @IsOptional()
  afterBlockGroupId?: string;
}
