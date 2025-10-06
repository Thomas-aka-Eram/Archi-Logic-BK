import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JoinByCodeDto } from './dto/join-by-code.dto';
export declare class InvitationController {
    private readonly invitationService;
    constructor(invitationService: InvitationService);
    createInvitation(req: any, createInvitationDto: CreateInvitationDto): Promise<{
        code: string;
        expiresAt: Date;
        invitationId: string;
    }>;
    revokeInvitation(req: any, invitationId: string): Promise<{
        status: string;
    }>;
    joinByCode(req: any, joinByCodeDto: JoinByCodeDto): Promise<{
        projectId: string;
        message: string;
    }>;
}
