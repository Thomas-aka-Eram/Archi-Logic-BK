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
import * as schema from '../db/schema';

@Injectable()
export class InvitationService {
  constructor(@Inject(DB) private readonly db: DbType) {}

  async create(
    requestingUserId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    console.log('createInvitationDto', createInvitationDto);
    const { projectId, roleOnJoin } = createInvitationDto;

    const projectMembership = await this.db.query.projectUserRoles.findFirst({
      where: and(
        eq(schema.projectUserRoles.userId, requestingUserId),
        eq(schema.projectUserRoles.projectId, projectId),
      ),
      with: {
        role: true,
      },
    });

    const requestingUserRole = projectMembership?.role?.name;
    const invitedRole = roleOnJoin || 'Developer'; // Default role if not specified

    // Check if the requesting user has a valid role before proceeding
    if (!requestingUserRole) {
      throw new ForbiddenException('You do not have a valid role in this project.');
    }

    // Define role hierarchy for comparison
    const ROLE_HIERARCHY: { [key: string]: number } = {
      'Admin': 3,
      'Manager': 2,
      'Developer': 1,
      'Viewer': 1,
      'Contributor': 1,
      'QA': 1,
      'Bot': 1,
    };

    const requestingUserRoleLevel = ROLE_HIERARCHY[requestingUserRole];
    const invitedRoleLevel = ROLE_HIERARCHY[invitedRole];

    // Check if the requesting user's role level is defined in the hierarchy
    if (requestingUserRoleLevel === undefined) {
      throw new ForbiddenException('Your role is not recognized in the system.');
    }

    if (requestingUserRoleLevel < 2) { // Roles lower than Manager (Developer, Viewer, etc.)
      throw new ForbiddenException('You do not have permission to invite users to this project.');
    }

    if (requestingUserRole === 'Manager' && invitedRoleLevel >= ROLE_HIERARCHY['Manager']) {
      throw new ForbiddenException('Managers can only invite roles lower than themselves.');
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const codeHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const invitationId = await this.db.transaction(async (tx) => {
      const [invitation] = await tx
        .insert(schema.invitations)
        .values({
          projectId,
          codeHash,
          createdBy: requestingUserId,
          expiresAt,
          roleOnJoin: roleOnJoin || 'Developer',
        })
        .returning();

      await tx.insert(schema.activityLogs).values({
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
        .from(schema.invitations)
        .where(
          and(
            eq(schema.invitations.codeHash, codeHash),
            eq(schema.invitations.status, 'active'),
          ),
        )
        .for('update');

      if (!invitation) {
        throw new NotFoundException('Invitation code is invalid or has been used.');
      }

      if (new Date() > invitation.expiresAt) {
        await tx
          .update(schema.invitations)
          .set({ status: 'expired' })
          .where(eq(schema.invitations.id, invitation.id));
        throw new ForbiddenException('Invitation code has expired.');
      }

      const [existingMembership] = await this.db
        .select()
        .from(schema.projectUserRoles)
        .where(
          and(
            eq(schema.projectUserRoles.userId, joiningUserId),
            eq(schema.projectUserRoles.projectId, invitation.projectId),
          ),
        );

      if (existingMembership) {
        // Idempotent: if already a member, do nothing.
        return { projectId: invitation.projectId, message: 'Already a member of this project.' };
      }

      // Find the roleId for the roleOnJoin
      const role = await tx.query.roles.findFirst({
        where: eq(schema.roles.name, invitation.roleOnJoin as string),
      });

      if (!role) {
        throw new NotFoundException(`Role '${invitation.roleOnJoin}' not found.`);
      }

      // Insert into projectUserRoles
      await tx.insert(schema.projectUserRoles).values({
        userId: joiningUserId,
        projectId: invitation.projectId,
        roleId: role.id,
      });

      // Remove the old userProjects entry for the joining user and project
      await tx.delete(schema.userProjects).where(
        and(
          eq(schema.userProjects.userId, joiningUserId),
          eq(schema.userProjects.projectId, invitation.projectId),
        ),
      );

      await tx
        .update(schema.invitations)
        .set({
          status: 'used',
          usedBy: joiningUserId,
          usedAt: new Date(),
        })
        .where(eq(schema.invitations.id, invitation.id));

      await tx.insert(schema.activityLogs).values({
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
        .from(schema.invitations)
        .where(eq(schema.invitations.id, invitationId));

      if (!invitation) {
        throw new NotFoundException('Invitation not found.');
      }

      const [projectMembership] = await tx
        .select()
        .from(schema.userProjects)
        .where(
          and(
            eq(schema.userProjects.userId, requestingUserId),
            eq(schema.userProjects.projectId, invitation.projectId),
          ),
        );

      if (
        !projectMembership ||
        !projectMembership.role ||
        !['Owner', 'Manager'].includes(projectMembership.role)
      ) {
        throw new ForbiddenException(
          'You do not have permission to revoke schema.invitations for this project.',
        );
      }

      if (invitation.status !== 'active') {
        throw new ForbiddenException('This invitation cannot be revoked.');
      }

      await tx
        .update(schema.invitations)
        .set({ status: 'revoked' })
        .where(eq(schema.invitations.id, invitationId));

      await tx.insert(schema.activityLogs).values({
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