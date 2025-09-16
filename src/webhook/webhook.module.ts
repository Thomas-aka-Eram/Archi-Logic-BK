import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
