import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  userId: string;

  @Prop({ required: false })
  image: string;

  @Prop({ required: false })
  video?: string;

  @Prop({ default: '' })
  caption: string;

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  likes: string[];

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: false })
  isHidden: boolean;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  hiddenFromFollowers: string[];

  @Prop({ default: null })
  deletedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Indexes for performance
PostSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user posts feed
PostSchema.index({ createdAt: -1 }); // For sorting by date
PostSchema.index({ likes: 1 }); // For like queries

