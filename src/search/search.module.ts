import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
