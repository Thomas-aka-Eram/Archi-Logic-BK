import { IsString, IsNotEmpty } from 'class-validator';

export class AddRepositoryDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., 'my-org/my-repo'

  @IsString()
  @IsNotEmpty()
  webhookSecret: string;
}
