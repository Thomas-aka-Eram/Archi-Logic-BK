import { ReviewService } from './review.service';
import { RequestReviewDto } from './dto/request-review.dto';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    requestReview(blockGroupId: string, requestReviewDto: RequestReviewDto, req: any): Promise<{
        id: string;
        createdAt: Date | null;
        status: string | null;
        blockId: string;
        requesterId: string | null;
        reviewerId: string;
        respondedAt: Date | null;
    }>;
    approveReview(reviewId: string, req: any): Promise<{
        status: string;
    }>;
    requestChanges(reviewId: string, message: string, req: any): Promise<{
        status: string;
    }>;
}
