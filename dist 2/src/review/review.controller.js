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
exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const review_service_1 = require("./review.service");
const request_review_dto_1 = require("./dto/request-review.dto");
let ReviewController = class ReviewController {
    reviewService;
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    async requestReview(blockGroupId, requestReviewDto, req) {
        const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        return this.reviewService.requestReview(blockGroupId, requestReviewDto, mockUserId);
    }
    async approveReview(reviewId, req) {
        const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        return this.reviewService.approveReview(reviewId, mockUserId);
    }
    async requestChanges(reviewId, message, req) {
        const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        return this.reviewService.requestChanges(reviewId, message, mockUserId);
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Post)('/block/:blockGroupId/request'),
    __param(0, (0, common_1.Param)('blockGroupId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe())),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_review_dto_1.RequestReviewDto, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "requestReview", null);
__decorate([
    (0, common_1.Post)(':reviewId/approve'),
    __param(0, (0, common_1.Param)('reviewId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "approveReview", null);
__decorate([
    (0, common_1.Post)(':reviewId/request-changes'),
    __param(0, (0, common_1.Param)('reviewId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('message')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "requestChanges", null);
exports.ReviewController = ReviewController = __decorate([
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
//# sourceMappingURL=review.controller.js.map