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
exports.ProjectController = void 0;
const common_1 = require("@nestjs/common");
const project_service_1 = require("./project.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const add_project_member_dto_1 = require("./dto/add-project-member.dto");
const update_member_role_dto_1 = require("./dto/update-member-role.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const document_service_1 = require("../document/document.service");
const create_document_dto_1 = require("../document/dto/create-document.dto");
let ProjectController = class ProjectController {
    projectService;
    documentService;
    constructor(projectService, documentService) {
        this.projectService = projectService;
        this.documentService = documentService;
    }
    async createDocument(req, projectId, createDocumentDto) {
        console.log('createDocument called');
        return this.documentService.createDocument(projectId, createDocumentDto, req.user.userId);
    }
    async getDocumentsForProject(projectId, phaseKey) {
        return this.documentService.getDocumentsForProject(projectId, phaseKey);
    }
    async getProjects(req) {
        console.log('GET /api/projects received');
        const userId = req.user.userId;
        console.log('Authenticated userId for getProjects:', userId);
        const projects = await this.projectService.getProjectsForUser(userId);
        console.log('Returning projects for user:', projects);
        return projects;
    }
    async createProject(createProjectDto, req) {
        console.log('POST /api/projects received');
        console.log('Request body:', createProjectDto);
        const userId = req.user.userId;
        console.log('Authenticated userId:', userId);
        return this.projectService.createProject(createProjectDto, userId);
    }
    async getProjectMembers(projectId) {
        return this.projectService.getProjectMembers(projectId);
    }
    async addProjectMember(projectId, addProjectMemberDto) {
        return this.projectService.addProjectMember(projectId, addProjectMemberDto);
    }
    async updateMemberRole(req, projectId, targetUserId, updateMemberRoleDto) {
        return this.projectService.updateMemberRole(req.user.userId, projectId, targetUserId, updateMemberRoleDto.role);
    }
    async getProjectPhases(projectId) {
        return this.projectService.getProjectPhases(projectId);
    }
    async getProjectById(projectId) {
        console.log(`GET /api/projects/${projectId} received`);
        return this.projectService.getProjectById(projectId);
    }
};
exports.ProjectController = ProjectController;
__decorate([
    (0, common_1.Post)(':projectId/documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_document_dto_1.CreateDocumentDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "createDocument", null);
__decorate([
    (0, common_1.Get)(':projectId/documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('phase')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getDocumentsForProject", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProjects", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "createProject", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProjectMembers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_project_member_dto_1.AddProjectMemberDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "addProjectMember", null);
__decorate([
    (0, common_1.Patch)(':projectId/members/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_member_role_dto_1.UpdateMemberRoleDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Get)(':id/phases'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProjectPhases", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProjectById", null);
exports.ProjectController = ProjectController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [project_service_1.ProjectService,
        document_service_1.DocumentService])
], ProjectController);
//# sourceMappingURL=project.controller.js.map