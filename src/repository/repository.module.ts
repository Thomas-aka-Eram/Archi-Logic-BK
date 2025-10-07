import { Module } from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class RepositoryModule {}