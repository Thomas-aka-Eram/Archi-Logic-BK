import { Module } from '@nestjs/common';
import { DomainService } from './domain.service';
import { DomainController } from './domain.controller';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [DomainController],
  providers: [DomainService],
})
export class DomainModule {}
