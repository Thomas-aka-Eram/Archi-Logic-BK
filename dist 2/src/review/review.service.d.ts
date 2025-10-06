import type { DbType } from '../db/drizzle.module';
import { RequestReviewDto } from './dto/request-review.dto';
export declare class ReviewService {
    private readonly db;
    constructor(db: DbType);
    requestReview(blockGroupId: string, requestReviewDto: RequestReviewDto, requesterId: string): Promise<{
        id: string;
        createdAt: Date | null;
        status: string | null;
        blockId: string;
        requesterId: string | null;
        reviewerId: string;
        respondedAt: Date | null;
    }>;
    approveReview(reviewId: string, reviewerId: string): Promise<{
        status: string;
    }>;
    requestChanges(reviewId: string, message: string, reviewerId: string): Promise<{
        status: string;
    }>;
}
