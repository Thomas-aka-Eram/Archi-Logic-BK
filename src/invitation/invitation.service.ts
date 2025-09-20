import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DB } from '../db/drizzle.module';
import type { DbType } from '../db/drizzle.module';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import * as crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { invitations, userProjects, activityLogs } from '../db/schema';

@Injectable()
export class InvitationService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async create(
    requestingUserId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    console.log('createInvitationDto', createInvitationDto);
    const { projectId, roleOnJoin } = createInvitationDto;

    const [projectMembership] = await this.db
      .select()
      .from(userProjects)
      .where(
        and(
          eq(userProjects.userId, requestingUserId),
          eq(userProjects.projectId, projectId),
        ),
      );

    if (
      !projectMembership ||
      !projectMembership.role ||
      !['Owner', 'Manager'].includes(projectMembership.role)
    ) {
      throw new ForbiddenException(
        'You do not have permission to invite users to this project.',
      );
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const codeHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const invitationId = await this.db.transaction(async (tx) => {
      const [invitation] = await tx
        .insert(invitations)
        .values({
          projectId,
          codeHash,
          createdBy: requestingUserId,
          expiresAt,
          roleOnJoin: roleOnJoin || 'Developer',
        })
        .returning();

      await tx.insert(activityLogs).values({
        userId: requestingUserId,
        projectId,
        action: 'INVITE_CREATED',
        entity: 'Invitation',
        entityId: invitation.id,
        newValues: {
          expiresAt,
          roleOnJoin: roleOnJoin || 'Developer',
        },
      });

      return invitation.id;
    });

    return {
      code: token,
      expiresAt,
      invitationId,
    };
  }

  async joinByCode(joiningUserId: string, code: string) {
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    return this.db.transaction(async (tx) => {
      const [invitation] = await tx
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.codeHash, codeHash),
            eq(invitations.status, 'active'),
          ),
        )
        .for('update');

      if (!invitation) {
        throw new NotFoundException('Invitation code is invalid or has been used.');
      }

      if (new Date() > invitation.expiresAt) {
        await tx
          .update(invitations)
          .set({ status: 'expired' })
          .where(eq(invitations.id, invitation.id));
        throw new ForbiddenException('Invitation code has expired.');
      }

      const [existingMembership] = await tx
        .select()
        .from(userProjects)
        .where(
          and(
            eq(userProjects.userId, joiningUserId),
            eq(userProjects.projectId, invitation.projectId),
          ),
        );

      if (existingMembership) {
        // Idempotent: if already a member, do nothing.
        return { projectId: invitation.projectId, message: 'Already a member of this project.' };
      }

      await tx.insert(userProjects).values({
        userId: joiningUserId,
        projectId: invitation.projectId,
        role: invitation.roleOnJoin,
        // Permissions would be derived here based on the role
      });

      await tx
        .update(invitations)
        .set({
          status: 'used',
          usedBy: joiningUserId,
          usedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));

      await tx.insert(activityLogs).values({
        userId: joiningUserId,
        projectId: invitation.projectId,
        action: 'INVITE_USED',
        entity: 'Invitation',
        entityId: invitation.id,
        newValues: {
          usedBy: joiningUserId,
        },
      });

      return { projectId: invitation.projectId, message: 'Successfully joined project.' };
    });
  }

  async revoke(requestingUserId: string, invitationId: string) {
    return this.db.transaction(async (tx) => {
      const [invitation] = await tx
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId));

      if (!invitation) {
        throw new NotFoundException('Invitation not found.');
      }

      const [projectMembership] = await tx
        .select()
        .from(userProjects)
        .where(
          and(
            eq(userProjects.userId, requestingUserId),
            eq(userProjects.projectId, invitation.projectId),
          ),
        );

      if (
        !projectMembership ||
        !projectMembership.role ||
        !['Owner', 'Manager'].includes(projectMembership.role)
      ) {
        throw new ForbiddenException(
          'You do not have permission to revoke invitations for this project.',
        );
      }

      if (invitation.status !== 'active') {
        throw new ForbiddenException('This invitation cannot be revoked.');
      }

      await tx
        .update(invitations)
        .set({ status: 'revoked' })
        .where(eq(invitations.id, invitationId));

      await tx.insert(activityLogs).values({
        userId: requestingUserId,
        projectId: invitation.projectId,
        action: 'INVITE_REVOKED',
        entity: 'Invitation',
        entityId: invitationId,
      });

      return { status: 'revoked' };
    });
  }
}