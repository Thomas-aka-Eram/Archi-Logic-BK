import { WebhookService } from './webhook.service';
import type { Request } from 'express';
export declare class WebhookController {
    private readonly webhookService;
    constructor(webhookService: WebhookService);
    handleGithubWebhook(req: Request): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        message?: undefined;
    }>;
}
