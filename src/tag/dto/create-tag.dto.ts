import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsHexColor,
} from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  phase?: string;
}
