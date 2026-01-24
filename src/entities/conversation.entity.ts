import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ type: [{ type: String, ref: 'User' }], required: true })
  participants: string[];

  @Prop({ type: String, ref: 'Message' })
  lastMessage: string;

  @Prop({ default: Date.now })
  lastMessageAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes for performance
ConversationSchema.index({ participants: 1 }); // For finding conversations by participants
ConversationSchema.index({ lastMessageAt: -1 }); // For sorting conversations by last message

