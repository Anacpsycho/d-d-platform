import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, MessageType, RecipientType } from './schemas/message.schema';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    private websocketGateway: WebsocketGateway,
  ) {}

  async sendMessage(
    campaignId: string,
    senderId: string,
    senderName: string,
    senderRole: 'master' | 'player',
    content: string,
    type: MessageType,
    recipientIds?: string[],
    recipientType: RecipientType = RecipientType.ALL,
    attachments?: any[],
  ): Promise<Message> {
    const message = new this.messageModel({
      campaignId: new Types.ObjectId(campaignId),
      type,
      senderId: new Types.ObjectId(senderId),
      senderName,
      senderRole,
      recipientIds: recipientIds?.map((id) => new Types.ObjectId(id)) || [],
      recipientType,
      content,
      attachments: attachments || [],
      timestamp: new Date(),
    });

    const savedMessage = await message.save();

    // Broadcast via WebSocket
    this.websocketGateway.broadcastMessage(campaignId, savedMessage);

    return savedMessage;
  }

  async getMessages(
    campaignId: string,
    userId: string,
    limit: number = 50,
  ): Promise<Message[]> {
    return this.messageModel
      .find({
        campaignId: new Types.ObjectId(campaignId),
        $or: [
          { recipientType: RecipientType.ALL },
          { recipientIds: new Types.ObjectId(userId) },
          { senderId: new Types.ObjectId(userId) },
        ],
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('senderId', 'username')
      .exec();
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const alreadyRead = message.readBy.some((r) => r.userId === userId);
    if (!alreadyRead) {
      message.readBy.push({ userId, readAt: new Date() });
      await message.save();
    }

    return message;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId.toString() !== userId) {
      throw new Error('Only the sender can delete the message');
    }

    message.deleted = true;
    await message.save();
  }
}

// Made with Bob
