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
exports.TagController = void 0;
const common_1 = require("@nestjs/common");
const tag_service_1 = require("./tag.service");
const create_tag_dto_1 = require("./dto/create-tag.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let TagController = class TagController {
    tagService;
    constructor(tagService) {
        this.tagService = tagService;
    }
    create(createTagDto, req) {
        const userId = req.user.userId;
        return this.tagService.create(createTagDto, userId);
    }
    findAll(projectId) {
        return this.tagService.findAll(projectId);
    }
};
exports.TagController = TagController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tag_dto_1.CreateTagDto, Object]),
    __metadata("design:returntype", void 0)
], TagController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TagController.prototype, "findAll", null);
exports.TagController = TagController = __decorate([
    (0, common_1.Controller)('tags'),
    __metadata("design:paramtypes", [tag_service_1.TagService])
], TagController);
//# sourceMappingURL=tag.controller.js.map