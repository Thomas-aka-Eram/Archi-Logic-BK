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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_module_1 = require("../db/drizzle.module");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
let ReviewService = class ReviewService {
    db;
    constructor(db) {
        this.db = db;
    }
    async requestReview(blockGroupId, requestReviewDto, requesterId) {
        const { reviewerId } = requestReviewDto;
        const [currentBlock] = await this.db
            .select()
            .from(schema.blocks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.blocks.blockGroupId, blockGroupId), (0, drizzle_orm_1.eq)(schema.blocks.isCurrentVersion, true)));
        if (!currentBlock) {
            throw new common_1.NotFoundException('Block not found.');
        }
        const [reviewRequest] = await this.db
            .insert(schema.reviewRequests)
            .values({
            blockId: currentBlock.id,
            reviewerId,
        })
            .returning();
        return reviewRequest;
    }
    async approveReview(reviewId, reviewerId) {
        const [reviewRequest] = await this.db
            .select()
            .from(schema.reviewRequests)
            .where((0, drizzle_orm_1.eq)(schema.reviewRequests.id, reviewId));
        if (!reviewRequest) {
            throw new common_1.NotFoundException('Review request not found.');
        }
        if (reviewRequest.reviewerId !== reviewerId) {
            throw new common_1.UnauthorizedException('You are not the reviewer for this request.');
        }
        await this.db
            .update(schema.reviewRequests)
            .set({ status: 'APPROVED', respondedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.reviewRequests.id, reviewId));
        await this.db
            .update(schema.blocks)
            .set({ status: 'APPROVED' })
            .where((0, drizzle_orm_1.eq)(schema.blocks.id, reviewRequest.blockId));
        return { status: 'ok' };
    }
    async requestChanges(reviewId, message, reviewerId) {
        const [reviewRequest] = await this.db
            .select()
            .from(schema.reviewRequests)
            .where((0, drizzle_orm_1.eq)(schema.reviewRequests.id, reviewId));
        if (!reviewRequest) {
            throw new common_1.NotFoundException('Review request not found.');
        }
        if (reviewRequest.reviewerId !== reviewerId) {
            throw new common_1.UnauthorizedException('You are not the reviewer for this request.');
        }
        await this.db
            .update(schema.reviewRequests)
            .set({ status: 'CHANGES_REQUESTED', respondedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.reviewRequests.id, reviewId));
        return { status: 'ok' };
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(drizzle_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], ReviewService);
//# sourceMappingURL=review.service.js.map