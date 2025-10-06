"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const DEFAULT_PHASES = [
    { key: 'REQUIREMENTS', title: 'Requirements', sortOrder: 1 },
    { key: 'DESIGN', title: 'Design', sortOrder: 2 },
    { key: 'DEVELOPMENT', title: 'Development', sortOrder: 3 },
    { key: 'TESTING', title: 'Testing', sortOrder: 4 },
    { key: 'DEPLOYMENT', title: 'Deployment', sortOrder: 5 },
    { key: 'MAINTENANCE', title: 'Maintenance', sortOrder: 6 },
];
let ProjectService = class ProjectService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createProject(createProjectDto, userId) {
        console.log('ProjectService.createProject called with:', createProjectDto, 'and userId:', userId);
        const { name, description, phases } = createProjectDto;
        const phasesToCreate = phases && phases.length > 0 ? phases : DEFAULT_PHASES;
        console.log('Phases to create:', phasesToCreate);
        console.log('Inserting new project into database...');
        const [createdProject] = await this.db
            .insert(schema_1.projects)
            .values({
            name,
            description,
            createdBy: userId,
        })
            .returning();
        console.log('Project created successfully:', createdProject);
        console.log('Assigning creator as project owner...');
        await this.db.insert(schema_1.userProjects).values({
            userId,
            projectId: createdProject.id,
            role: 'Owner',
            permissions: ['ADMIN'],
        });
        console.log('Project owner assigned.');
        const phaseValues = phasesToCreate.map((phase) => ({
            projectId: createdProject.id,
            key: phase.key,
            title: phase.title,
            sortOrder: phase.sortOrder,
        }));
        console.log('Inserting project phases:', phaseValues);
        await this.db.insert(schema_1.projectPhases).values(phaseValues);
        console.log('Project phases inserted.');
        console.log('Querying for the full project data to return...');
        const result = await this.db.query.projects.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.projects.id, createdProject.id),
            with: {
                phases: {
                    orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
                },
            },
        });
        console.log('Returning final project data:', result);
        return result;
    }
    async addProjectMember(projectId, addProjectMemberDto) {
        const { userId, role, permissions } = addProjectMemberDto;
        const projectExists = await this.db.query.projects.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.projects.id, projectId),
        });
        if (!projectExists) {
            throw new common_1.NotFoundException('Project not found');
        }
        const userExists = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, userId),
        });
        if (!userExists) {
            throw new common_1.NotFoundException('User not found');
        }
        const [newUserProject] = await this.db
            .insert(schema_1.userProjects)
            .values({
            projectId,
            userId,
            role,
            permissions,
        })
            .returning();
        return newUserProject;
    }
    async getProjectsForUser(userId) {
        console.log('ProjectService.getProjectsForUser called for userId:', userId);
        const projectsForUser = await this.db.query.userProjects.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.userProjects.userId, userId),
            with: {
                project: true,
            },
        });
        console.log('Found userProjects entries:', projectsForUser);
        const projects = projectsForUser.map((up) => up.project);
        console.log('Mapped projects to return:', projects);
        return projects;
    }
    async getProjectPhases(projectId) {
        const phases = await this.db.query.projectPhases.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.projectPhases.projectId, projectId),
            orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
        });
        if (!phases || phases.length === 0) {
            const projectExists = await this.db.query.projects.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.projects.id, projectId),
            });
            if (!projectExists) {
                throw new common_1.NotFoundException('Project not found');
            }
        }
        return phases;
    }
    async updateMemberRole(requestingUserId, projectId, targetUserId, newRole) {
        return this.db.transaction(async (tx) => {
            const [requesterMembership] = await tx
                .select()
                .from(schema_1.userProjects)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userProjects.userId, requestingUserId), (0, drizzle_orm_1.eq)(schema_1.userProjects.projectId, projectId)));
            if (!requesterMembership ||
                !requesterMembership.role ||
                !['Owner', 'Manager'].includes(requesterMembership.role)) {
                throw new common_1.ForbiddenException('You do not have permission to manage member roles for this project.');
            }
            const [targetMembership] = await tx
                .select()
                .from(schema_1.userProjects)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userProjects.userId, targetUserId), (0, drizzle_orm_1.eq)(schema_1.userProjects.projectId, projectId)));
            if (!targetMembership) {
                throw new common_1.NotFoundException('Member not found in this project.');
            }
            const [updatedMembership] = await tx
                .update(schema_1.userProjects)
                .set({ role: newRole })
                .where((0, drizzle_orm_1.eq)(schema_1.userProjects.id, targetMembership.id))
                .returning();
            await tx.insert(schema_1.activityLogs).values({
                userId: requestingUserId,
                projectId,
                action: 'MEMBER_ROLE_UPDATED',
                entity: 'UserProject',
                entityId: targetMembership.id,
                oldValues: { role: targetMembership.role },
                newValues: { role: newRole },
            });
            return updatedMembership;
        });
    }
    async getProjectMembers(projectId) {
        const members = await this.db.query.userProjects.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.userProjects.projectId, projectId),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return members;
    }
    async getProjectById(projectId) {
        console.log('ProjectService.getProjectById called for projectId:', projectId);
        const project = await this.db.query.projects.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.projects.id, projectId),
            with: {
                phases: {
                    orderBy: (phase, { asc }) => [asc(phase.sortOrder)],
                },
                userProjects: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        console.log('Found project:', project);
        return project;
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], ProjectService);
//# sourceMappingURL=project.service.js.map