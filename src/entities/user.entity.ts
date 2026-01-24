import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  followers: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  following: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  blockedUsers: string[];

  @Prop({ type: [{ type: String, ref: 'Post' }], default: [] })
  savedPosts: string[];

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  hideFollowers: boolean;

  @Prop({ default: false })
  hideFollowing: boolean;

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  hiddenFollowers: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  hiddenFollowing: string[];

  @Prop({ 
    type: String, 
    enum: ['user', 'moderator', 'admin', 'super_admin'], 
    default: 'user' 
  })
  role: string;

  @Prop({ default: 0 })
  warningCount: number;

  @Prop({ type: Date, default: null })
  bannedUntil: Date | null;

  @Prop({ default: false })
  isPermanentlyBanned: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for performance
UserSchema.index({ fullName: 1 }); // For search queries
UserSchema.index({ role: 1 }); // For role queries
UserSchema.index({ followers: 1 }); // For follower queries
UserSchema.index({ following: 1 }); // For following queries
UserSchema.index({ blockedUsers: 1 }); // For blocked users queries
UserSchema.index({ isPermanentlyBanned: 1, bannedUntil: 1 }); // For ban queries

