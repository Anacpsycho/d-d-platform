import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  PRIVATE = 'private',
  GROUP = 'group',
  SYSTEM = 'system',
}

export enum SenderRole {
  MASTER = 'master',
  PLAYER = 'player',
}

export enum RecipientType {
  USER = 'user',
  ALL = 'all',
  MASTERS_ONLY = 'masters_only',
}

export interface MessageAttachment {
  type: 'image' | 'file' | 'dice_roll' | 'character_sheet';
  url?: string;
  data?: any;
}

export interface ReadReceipt {
  userId: string;
  readAt: Date;
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  // Tipo messaggio
  @Prop({ type: String, enum: MessageType, required: true })
  type: MessageType;

  // Mittente
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderName: string;

  @Prop({ type: String, enum: SenderRole, required: true })
  senderRole: SenderRole;

  // Destinatari
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  recipientIds: Types.ObjectId[];

  @Prop({ type: String, enum: RecipientType, required: true })
  recipientType: RecipientType;

  // Contenuto
  @Prop({ required: true })
  content: string;

  @Prop({ type: [Object], default: [] })
  attachments: MessageAttachment[];

  // Metadata
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ default: false })
  edited: boolean;

  @Prop()
  editedAt?: Date;

  @Prop({ default: false })
  deleted: boolean;

  // Read receipts
  @Prop({ type: [Object], default: [] })
  readBy: ReadReceipt[];

  // Thread
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyToId?: Types.ObjectId;

  @Prop()
  threadId?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ campaignId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ recipientIds: 1 });
MessageSchema.index({ type: 1 });
MessageSchema.index({ threadId: 1 });

// Made with Bob
