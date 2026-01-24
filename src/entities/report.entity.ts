import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ReportType {
  USER = 'user',
  POST = 'post',
  COMMENT = 'comment',
  MESSAGE = 'message',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COPYRIGHT = 'copyright',
  FAKE_NEWS = 'fake_news',
  HATE_SPEECH = 'hate_speech',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  reporterId: string; // Şikayet eden kullanıcı

  @Prop({ required: true, type: String })
  reportedId: string; // Şikayet edilen (user, post, comment, message id)

  @Prop({ required: true, enum: ReportType })
  type: ReportType;

  @Prop({ required: true, enum: ReportReason })
  reason: ReportReason;

  @Prop({ default: '' })
  description: string; // Detaylı açıklama

  @Prop({ enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Prop({ enum: ReportPriority, default: ReportPriority.MEDIUM })
  priority: ReportPriority;

  @Prop({ type: String, ref: 'User', default: null })
  reviewedBy: string; // İnceleyen admin/moderator

  @Prop({ default: null })
  reviewedAt: Date;

  @Prop({ default: '' })
  adminNote: string; // Admin'in notu

  @Prop({ default: 1 })
  reportCount: number; // Aynı içerik için kaç kez şikayet edilmiş
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Indexes for performance
ReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
ReportSchema.index({ reportedId: 1, type: 1 });
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ reviewedBy: 1 });

