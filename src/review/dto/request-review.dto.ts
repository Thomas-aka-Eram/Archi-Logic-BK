import { IsUUID } from 'class-validator';

export class RequestReviewDto {
  @IsUUID()
  reviewerId: string;
}
