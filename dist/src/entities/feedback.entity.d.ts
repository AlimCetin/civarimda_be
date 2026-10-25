export type FeedbackType = 'rating' | 'suggestion' | 'bug' | 'other';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'archived';
export declare class Feedback {
    id: string;
    userId: string | null;
    userName: string;
    userEmail: string;
    rating: number;
    type: FeedbackType;
    title: string;
    message: string;
    deviceInfo: string;
    status: FeedbackStatus;
    adminNote: string | null;
    createdAt: Date;
    updatedAt: Date;
}
