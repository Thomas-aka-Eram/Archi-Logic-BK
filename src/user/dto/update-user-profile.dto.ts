import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  // TODO: Add a more robust validation for timezone (e.g., against a list of valid IANA timezones)
  timezone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'es', 'fr']) // Example languages
  language?: string;

  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system']) // Example themes
  theme?: string;
}
