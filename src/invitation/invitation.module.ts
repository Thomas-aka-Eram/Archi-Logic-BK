import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { DrizzleModule } from '@/db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
