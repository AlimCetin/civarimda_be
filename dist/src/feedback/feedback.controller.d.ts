import { FeedbackService } from './feedback.service';
import { FeedbackType } from '../entities/feedback.entity';
import { User } from '../entities/user.entity';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    submitFeedback(body: {
        rating?: number;
        type?: FeedbackType;
        title?: string;
        message: string;
        deviceInfo?: string;
        userName?: string;
        userEmail?: string;
    }, req: any): Promise<import("../entities/feedback.entity").Feedback>;
    getFeedbacks(status?: string, type?: string, user?: User): Promise<import("../entities/feedback.entity").Feedback[]>;
    getFeedbackStats(user?: User): Promise<{
        totalCount: number;
        avgRating: number;
        suggestionCount: number;
        bugCount: number;
        ratingCount: number;
        pendingCount: number;
    }>;
    updateStatus(id: string, body: {
        status: string;
        adminNote?: string;
    }, user?: User): Promise<import("../entities/feedback.entity").Feedback>;
}
