import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { DbType } from '../db/drizzle.module';
export declare class GithubSignatureGuard implements CanActivate {
    private readonly db;
    constructor(db: DbType);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
    private validateSignature;
}
