import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AdType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum AdStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  DRAFT = 'draft',
}

@Schema({ timestamps: true })
export class Ad extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: AdType })
  type: AdType;

  @Prop({ required: true })
  mediaUrl: string; // Resim veya video URL'i

  @Prop({ required: true })
  linkUrl: string; // Reklama tıklanınca gidilecek URL

  @Prop({ default: '' })
  description: string;

  @Prop({ enum: AdStatus, default: AdStatus.DRAFT })
  status: AdStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 0 })
  clickCount: number; // Tıklanma sayısı

  @Prop({ default: 0 })
  viewCount: number; // Görüntülenme sayısı

  @Prop({ default: 0 })
  impressionCount: number; // Gösterim sayısı

  @Prop({ type: String, ref: 'User' })
  createdBy: string; // Oluşturan admin

  @Prop({ default: 0 })
  maxImpressions: number; // Maksimum gösterim sayısı (0 = sınırsız)

  @Prop({ default: 0 })
  budget: number; // Reklam bütçesi

  @Prop({ default: 0 })
  spentAmount: number; // Harcanan miktar
}

export const AdSchema = SchemaFactory.createForClass(Ad);

// Indexes for performance
AdSchema.index({ status: 1, startDate: 1, endDate: 1 });
AdSchema.index({ createdBy: 1 });
AdSchema.index({ createdAt: -1 });

