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
exports.DocumentController = void 0;
const common_1 = require("@nestjs/common");
const document_service_1 = require("./document.service");
const add_block_dto_1 = require("./dto/add-block.dto");
const update_block_dto_1 = require("./dto/update-block.dto");
const assign_tags_dto_1 = require("./dto/assign-tags.dto");
const assign_domain_dto_1 = require("./dto/assign-domain.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const update_document_dto_1 = require("./dto/update-document.dto");
let DocumentController = class DocumentController {
    documentService;
    constructor(documentService) {
        this.documentService = documentService;
    }
    async updateDocument(docId, updateDocumentDto) {
        return this.documentService.updateDocument(docId, updateDocumentDto);
    }
    async getDocument(docId) {
        return this.documentService.getDocument(docId);
    }
    async deleteDocument(docId) {
        return this.documentService.deleteDocument(docId);
    }
    async getDocumentBlocks(docId, currentOnly = 'true') {
        return this.documentService.getDocumentBlocks(docId, currentOnly === 'true');
    }
    async addBlock(docId, addBlockDto, req) {
        return this.documentService.addBlock(docId, addBlockDto, req.user.id);
    }
    async updateBlock(blockGroupId, updateBlockDto, req) {
        return this.documentService.updateBlock(blockGroupId, updateBlockDto, req.user.id);
    }
    async assignTagsToBlock(blockGroupId, assignTagsDto) {
        return this.documentService.assignTagsToBlock(blockGroupId, assignTagsDto.tagIds);
    }
    async assignDomainToBlock(blockGroupId, assignDomainDto) {
        return this.documentService.assignDomainToBlock(blockGroupId, assignDomainDto.domainId);
    }
};
exports.DocumentController = DocumentController;
__decorate([
    (0, common_1.Patch)(':docId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('docId')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_document_dto_1.UpdateDocumentDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "updateDocument", null);
__decorate([
    (0, common_1.Get)(':docId'),
    __param(0, (0, common_1.Param)('docId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Delete)(':docId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('docId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Get)(':docId/blocks'),
    __param(0, (0, common_1.Param)('docId')),
    __param(1, (0, common_1.Query)('currentOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "getDocumentBlocks", null);
__decorate([
    (0, common_1.Post)(':docId/blocks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('docId')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_block_dto_1.AddBlockDto, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "addBlock", null);
__decorate([
    (0, common_1.Patch)('blocks/:blockGroupId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('blockGroupId')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_block_dto_1.UpdateBlockDto, Object]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "updateBlock", null);
__decorate([
    (0, common_1.Patch)('blocks/:blockGroupId/tags'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('blockGroupId')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_tags_dto_1.AssignTagsDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "assignTagsToBlock", null);
__decorate([
    (0, common_1.Patch)('blocks/:blockGroupId/domain'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('blockGroupId')),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_domain_dto_1.AssignDomainDto]),
    __metadata("design:returntype", Promise)
], DocumentController.prototype, "assignDomainToBlock", null);
exports.DocumentController = DocumentController = __decorate([
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [document_service_1.DocumentService])
], DocumentController);
//# sourceMappingURL=document.controller.js.map