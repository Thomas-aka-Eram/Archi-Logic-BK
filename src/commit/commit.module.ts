
import { Module } from '@nestjs/common';
import { CommitService } from './commit.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [CommitService],
  exports: [CommitService],
})
export class CommitModule {}
