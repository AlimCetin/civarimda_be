import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true, type: String, ref: 'Conversation' })
  conversationId: string;

  @Prop({ required: true, type: String, ref: 'User' })
  senderId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: null })
  deletedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for performance
MessageSchema.index({ conversationId: 1, createdAt: -1 }); // Compound index for conversation messages
MessageSchema.index({ senderId: 1 }); // For sender queries
MessageSchema.index({ read: 1 }); // For unread message queries

