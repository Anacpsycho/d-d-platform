import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageType, RecipientType } from './schemas/message.schema';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  sendMessage(
    @Body('campaignId') campaignId: string,
    @Body('content') content: string,
    @Body('type') type: MessageType,
    @Body('recipientIds') recipientIds: string[],
    @Body('recipientType') recipientType: RecipientType,
    @Body('attachments') attachments: any[],
    @Request() req,
  ) {
    return this.messagingService.sendMessage(
      campaignId,
      req.user.userId,
      req.user.username,
      'player', // This should be determined from user role
      content,
      type,
      recipientIds,
      recipientType,
      attachments,
    );
  }

  @Get('campaign/:campaignId')
  getMessages(
    @Param('campaignId') campaignId: string,
    @Query('limit') limit: number,
    @Request() req,
  ) {
    return this.messagingService.getMessages(campaignId, req.user.userId, limit);
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagingService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  deleteMessage(@Param('id') id: string, @Request() req) {
    return this.messagingService.deleteMessage(id, req.user.userId);
  }
}

// Made with Bob
