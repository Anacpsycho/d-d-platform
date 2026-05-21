import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  private sessionRooms: Map<string, Set<string>> = new Map(); // sessionId -> Set of socketIds

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketUsers.delete(client.id);
    }

    // Remove from all session rooms
    this.sessionRooms.forEach((sockets, sessionId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.sessionRooms.delete(sessionId);
      }
    });
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    
    // Store user-socket mapping
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    this.socketUsers.set(client.id, userId);

    client.emit('authenticated', { success: true, userId });
  }

  @SubscribeMessage('join-session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    
    // Join socket.io room
    client.join(`session:${sessionId}`);
    
    // Track in our map
    if (!this.sessionRooms.has(sessionId)) {
      this.sessionRooms.set(sessionId, new Set());
    }
    this.sessionRooms.get(sessionId)!.add(client.id);

    client.emit('joined-session', { sessionId });
    
    // Notify others in the session
    client.to(`session:${sessionId}`).emit('user-joined-session', {
      userId: this.socketUsers.get(client.id),
      sessionId,
    });
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    
    // Leave socket.io room
    client.leave(`session:${sessionId}`);
    
    // Remove from our map
    const sessionSockets = this.sessionRooms.get(sessionId);
    if (sessionSockets) {
      sessionSockets.delete(client.id);
      if (sessionSockets.size === 0) {
        this.sessionRooms.delete(sessionId);
      }
    }

    client.emit('left-session', { sessionId });
    
    // Notify others in the session
    client.to(`session:${sessionId}`).emit('user-left-session', {
      userId: this.socketUsers.get(client.id),
      sessionId,
    });
  }

  @SubscribeMessage('join-campaign')
  handleJoinCampaign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string },
  ) {
    const { campaignId } = data;
    client.join(`campaign:${campaignId}`);
    client.emit('joined-campaign', { campaignId });
  }

  @SubscribeMessage('leave-campaign')
  handleLeaveCampaign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string },
  ) {
    const { campaignId } = data;
    client.leave(`campaign:${campaignId}`);
    client.emit('left-campaign', { campaignId });
  }

  // Broadcasting methods (called from services)
  
  broadcastToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, data);
  }

  broadcastToCampaign(campaignId: string, event: string, data: any) {
    this.server.to(`campaign:${campaignId}`).emit(event, data);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  broadcastToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.broadcastToUser(userId, event, data);
    });
  }

  // Game event broadcasting
  
  broadcastGameEvent(sessionId: string, gameEvent: any) {
    this.broadcastToSession(sessionId, 'game-event', gameEvent);
  }

  broadcastCombatUpdate(sessionId: string, combatData: any) {
    this.broadcastToSession(sessionId, 'combat-update', combatData);
  }

  broadcastCharacterUpdate(sessionId: string, characterId: string, updates: any) {
    this.broadcastToSession(sessionId, 'character-update', {
      characterId,
      updates,
    });
  }

  broadcastDiceRoll(sessionId: string, rollData: any) {
    this.broadcastToSession(sessionId, 'dice-roll', rollData);
  }

  broadcastMessage(campaignId: string, message: any) {
    this.broadcastToCampaign(campaignId, 'new-message', message);
  }

  // Typing indicators
  
  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string; conversationId?: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    const room = data.conversationId 
      ? `conversation:${data.conversationId}`
      : `campaign:${data.campaignId}`;
    
    client.to(room).emit('user-typing', { userId, ...data });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string; conversationId?: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    const room = data.conversationId 
      ? `conversation:${data.conversationId}`
      : `campaign:${data.campaignId}`;
    
    client.to(room).emit('user-stopped-typing', { userId, ...data });
  }

  // Utility methods
  
  getConnectedUsers(sessionId: string): string[] {
    const socketIds = this.sessionRooms.get(sessionId);
    if (!socketIds) return [];
    
    const userIds = new Set<string>();
    socketIds.forEach((socketId) => {
      const userId = this.socketUsers.get(socketId);
      if (userId) {
        userIds.add(userId);
      }
    });
    
    return Array.from(userIds);
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}

// Made with Bob
