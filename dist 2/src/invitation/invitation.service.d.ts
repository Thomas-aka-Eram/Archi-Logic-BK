import type { DbType } from '../db/drizzle.module';
import { CreateInvitationDto } from './dto/create-invitation.dto';
export declare class InvitationService {
    private readonly db;
    constructor(db: DbType);
    create(requestingUserId: string, createInvitationDto: CreateInvitationDto): Promise<{
        code: string;
        expiresAt: Date;
        invitationId: string;
    }>;
    joinByCode(joiningUserId: string, code: string): Promise<{
        projectId: string;
        message: string;
    }>;
    revoke(requestingUserId: string, invitationId: string): Promise<{
        status: string;
    }>;
}
