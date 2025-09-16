import { Module } from '@nestjs/common';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [RepositoryController],
  providers: [RepositoryService],
})
export class RepositoryModule {}
