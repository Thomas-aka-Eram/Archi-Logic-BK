import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { GithubSignatureGuard } from './github-signature.guard';
import type { Request } from 'express';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('github')
  @UseGuards(GithubSignatureGuard)
  async handleGithubWebhook(@Req() req: Request) {
    const rawBody = req.rawBody; // Assumes rawBody is populated by a middleware
    if (!rawBody) {
      return { status: 'error', message: 'Missing rawBody' };
    }
    const payload = JSON.parse(rawBody.toString());
    const event = req.headers['x-github-event'] as string;

    if (event === 'push') {
      await this.webhookService.processPushEvent(payload);
    }

    return { status: 'ok' };
  }
}
