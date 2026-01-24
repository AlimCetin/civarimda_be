import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AppealStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Appeal extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  userId: string; // İtiraz eden kullanıcı

  @Prop({ required: true, type: String, ref: 'ActivityLog' })
  banLogId: string; // Ban işleminin log ID'si

  @Prop({ required: true })
  reason: string; // İtiraz nedeni

  @Prop({ enum: AppealStatus, default: AppealStatus.PENDING })
  status: AppealStatus;

  @Prop({ type: String, ref: 'User', default: null })
  reviewedBy: string; // İnceleyen admin

  @Prop({ default: null })
  reviewedAt: Date;

  @Prop({ default: '' })
  adminResponse: string; // Admin'in cevabı

  @Prop({ type: [{ 
    senderId: { type: String, ref: 'User' },
    message: String,
    createdAt: Date
  }], default: [] })
  conversation: Array<{
    senderId: string;
    message: string;
    createdAt: Date;
  }>; // Kullanıcı ve admin arasındaki mesajlaşma
}

export const AppealSchema = SchemaFactory.createForClass(Appeal);

// Indexes for performance
AppealSchema.index({ userId: 1, status: 1, createdAt: -1 });
AppealSchema.index({ reviewedBy: 1 });
AppealSchema.index({ status: 1, createdAt: -1 });

