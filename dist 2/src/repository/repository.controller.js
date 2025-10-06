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
exports.RepositoryController = void 0;
const common_1 = require("@nestjs/common");
const repository_service_1 = require("./repository.service");
const add_repository_dto_1 = require("./dto/add-repository.dto");
let RepositoryController = class RepositoryController {
    repositoryService;
    constructor(repositoryService) {
        this.repositoryService = repositoryService;
    }
    async addRepository(projectId, addRepositoryDto, req) {
        const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        return this.repositoryService.addRepository(projectId, addRepositoryDto, mockUserId);
    }
};
exports.RepositoryController = RepositoryController;
__decorate([
    (0, common_1.Post)('/project/:projectId'),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_repository_dto_1.AddRepositoryDto, Object]),
    __metadata("design:returntype", Promise)
], RepositoryController.prototype, "addRepository", null);
exports.RepositoryController = RepositoryController = __decorate([
    (0, common_1.Controller)('repositories'),
    __metadata("design:paramtypes", [repository_service_1.RepositoryService])
], RepositoryController);
//# sourceMappingURL=repository.controller.js.map