import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  taskAssignments?: boolean;

  @IsOptional()
  @IsBoolean()
  reviewRequests?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;
}
