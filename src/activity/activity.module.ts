import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
