import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  RawBodyRequest,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';
import type { DbType } from '../db/drizzle.module';
import { DB } from '../db/drizzle.module';
import { eq } from 'drizzle-orm';
import { repositories } from '../db/schema';

@Injectable()
export class GithubSignatureGuard implements CanActivate {
  constructor(@Inject(DB) private readonly db: DbType) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RawBodyRequest<Request>>();
    const signature = request.headers['x-hub-signature-256'] as string;

    if (!signature) {
      return false;
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      return false;
    }

    const repoName = JSON.parse(rawBody.toString()).repository.full_name;
    return this.validateSignature(repoName, signature, rawBody);
  }

  private async validateSignature(
    repoName: string,
    signature: string,
    rawBody: Buffer,
  ): Promise<boolean> {
    const repo = await this.db.query.repositories.findFirst({
      where: eq(repositories.name, repoName),
    });

    if (!repo || !repo.webhookSecret) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', repo.webhookSecret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }
}
