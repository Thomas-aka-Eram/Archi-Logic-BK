import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateTagDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
