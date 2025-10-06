"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const crypto = __importStar(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
let InvitationService = class InvitationService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(requestingUserId, createInvitationDto) {
        console.log('createInvitationDto', createInvitationDto);
        const { projectId, roleOnJoin } = createInvitationDto;
        const [projectMembership] = await this.db
            .select()
            .from(schema_1.userProjects)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userProjects.userId, requestingUserId), (0, drizzle_orm_1.eq)(schema_1.userProjects.projectId, projectId)));
        if (!projectMembership ||
            !projectMembership.role ||
            !['Owner', 'Manager'].includes(projectMembership.role)) {
            throw new common_1.ForbiddenException('You do not have permission to invite users to this project.');
        }
        const token = crypto.randomBytes(32).toString('base64url');
        const codeHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const invitationId = await this.db.transaction(async (tx) => {
            const [invitation] = await tx
                .insert(schema_1.invitations)
                .values({
                projectId,
                codeHash,
                createdBy: requestingUserId,
                expiresAt,
                roleOnJoin: roleOnJoin || 'Developer',
            })
                .returning();
            await tx.insert(schema_1.activityLogs).values({
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
    async joinByCode(joiningUserId, code) {
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');
        return this.db.transaction(async (tx) => {
            const [invitation] = await tx
                .select()
                .from(schema_1.invitations)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.invitations.codeHash, codeHash), (0, drizzle_orm_1.eq)(schema_1.invitations.status, 'active')))
                .for('update');
            if (!invitation) {
                throw new common_1.NotFoundException('Invitation code is invalid or has been used.');
            }
            if (new Date() > invitation.expiresAt) {
                await tx
                    .update(schema_1.invitations)
                    .set({ status: 'expired' })
                    .where((0, drizzle_orm_1.eq)(schema_1.invitations.id, invitation.id));
                throw new common_1.ForbiddenException('Invitation code has expired.');
            }
            const [existingMembership] = await tx
                .select()
                .from(schema_1.userProjects)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userProjects.userId, joiningUserId), (0, drizzle_orm_1.eq)(schema_1.userProjects.projectId, invitation.projectId)));
            if (existingMembership) {
                return { projectId: invitation.projectId, message: 'Already a member of this project.' };
            }
            await tx.insert(schema_1.userProjects).values({
                userId: joiningUserId,
                projectId: invitation.projectId,
                role: invitation.roleOnJoin,
            });
            await tx
                .update(schema_1.invitations)
                .set({
                status: 'used',
                usedBy: joiningUserId,
                usedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.invitations.id, invitation.id));
            await tx.insert(schema_1.activityLogs).values({
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
    async revoke(requestingUserId, invitationId) {
        return this.db.transaction(async (tx) => {
            const [invitation] = await tx
                .select()
                .from(schema_1.invitations)
                .where((0, drizzle_orm_1.eq)(schema_1.invitations.id, invitationId));
            if (!invitation) {
                throw new common_1.NotFoundException('Invitation not found.');
            }
            const [projectMembership] = await tx
                .select()
                .from(schema_1.userProjects)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userProjects.userId, requestingUserId), (0, drizzle_orm_1.eq)(schema_1.userProjects.projectId, invitation.projectId)));
            if (!projectMembership ||
                !projectMembership.role ||
                !['Owner', 'Manager'].includes(projectMembership.role)) {
                throw new common_1.ForbiddenException('You do not have permission to revoke invitations for this project.');
            }
            if (invitation.status !== 'active') {
                throw new common_1.ForbiddenException('This invitation cannot be revoked.');
            }
            await tx
                .update(schema_1.invitations)
                .set({ status: 'revoked' })
                .where((0, drizzle_orm_1.eq)(schema_1.invitations.id, invitationId));
            await tx.insert(schema_1.activityLogs).values({
                userId: requestingUserId,
                projectId: invitation.projectId,
                action: 'INVITE_REVOKED',
                entity: 'Invitation',
                entityId: invitationId,
            });
            return { status: 'revoked' };
        });
    }
};
exports.InvitationService = InvitationService;
exports.InvitationService = InvitationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], InvitationService);
//# sourceMappingURL=invitation.service.js.map