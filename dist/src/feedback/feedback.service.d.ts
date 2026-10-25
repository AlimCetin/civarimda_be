import { Repository } from 'typeorm';
import { Feedback, FeedbackStatus, FeedbackType } from '../entities/feedback.entity';
export declare class FeedbackService {
    private feedbackRepo;
    constructor(feedbackRepo: Repository<Feedback>);
    create(data: {
        userId?: string;
        userName?: string;
        userEmail?: string;
        rating?: number;
        type?: FeedbackType;
        title?: string;
        message: string;
        deviceInfo?: string;
    }): Promise<Feedback>;
    findAll(status?: FeedbackStatus, type?: FeedbackType): Promise<Feedback[]>;
    updateStatus(id: string, status: FeedbackStatus, adminNote?: string): Promise<Feedback>;
    getStats(): Promise<{
        totalCount: number;
        avgRating: number;
        suggestionCount: number;
        bugCount: number;
        ratingCount: number;
        pendingCount: number;
    }>;
}
