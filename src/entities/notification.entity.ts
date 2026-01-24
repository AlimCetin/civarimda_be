import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  userId: string;

  @Prop({ required: true, type: String, ref: 'User' })
  fromUserId: string;

  @Prop({ required: true, enum: ['like', 'comment', 'follow', 'message'] })
  type: string;

  @Prop({ type: String, ref: 'Post' })
  postId?: string;

  @Prop({ type: String, default: null })
  postOwnerName?: string; // Takipçi bildirimlerinde post sahibinin adı

  @Prop({ default: false })
  isFollowerNotification: boolean; // Takipçi bildirimi mi?

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: null })
  deletedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user notifications
NotificationSchema.index({ userId: 1, read: 1 }); // For unread notifications
NotificationSchema.index({ fromUserId: 1 }); // For notification queries

