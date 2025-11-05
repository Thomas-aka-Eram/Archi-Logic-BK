import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { DrizzleModule } from '@/db/drizzle.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [DrizzleModule, ActivityModule],
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
