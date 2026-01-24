import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ActivityType {
  USER_BANNED = 'user_banned',
  USER_UNBANNED = 'user_unbanned',
  USER_WARNED = 'user_warned',
  POST_DELETED = 'post_deleted',
  POST_HIDDEN = 'post_hidden',
  REPORT_RESOLVED = 'report_resolved',
  REPORT_REJECTED = 'report_rejected',
  AD_CREATED = 'ad_created',
  AD_UPDATED = 'ad_updated',
  AD_DELETED = 'ad_deleted',
  ROLE_CHANGED = 'role_changed',
}

@Schema({ timestamps: true })
export class ActivityLog extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  adminId: string; // İşlemi yapan admin/moderator

  @Prop({ required: true, enum: ActivityType })
  activityType: ActivityType;

  @Prop({ type: String, ref: 'User', default: null })
  targetUserId: string; // İşlem yapılan kullanıcı (varsa)

  @Prop({ type: String, ref: 'Post', default: null })
  targetPostId: string; // İşlem yapılan post (varsa)

  @Prop({ type: String, ref: 'Report', default: null })
  targetReportId: string; // İşlem yapılan şikayet (varsa)

  @Prop({ type: String, ref: 'Ad', default: null })
  targetAdId: string; // İşlem yapılan reklam (varsa)

  @Prop({ default: '' })
  description: string; // İşlem açıklaması

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>; // Ek bilgiler (ban süresi, eski rol, yeni rol, vb.)
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Indexes for performance
ActivityLogSchema.index({ adminId: 1, createdAt: -1 });
ActivityLogSchema.index({ targetUserId: 1, createdAt: -1 });
ActivityLogSchema.index({ activityType: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

