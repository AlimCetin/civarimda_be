import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true, type: String, ref: 'Post' })
  postId: string;

  @Prop({ required: true, type: String, ref: 'User' })
  userId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: null })
  deletedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes for performance
CommentSchema.index({ postId: 1, createdAt: -1 }); // Compound index for post comments
CommentSchema.index({ userId: 1 }); // For user comment queries

