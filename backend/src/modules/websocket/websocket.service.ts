import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(private readonly gateway: WebsocketGateway) {}

  // Session broadcasting
  broadcastToSession(sessionId: string, event: string, data: any) {
    this.gateway.broadcastToSession(sessionId, event, data);
  }

  broadcastToCampaign(campaignId: string, event: string, data: any) {
    this.gateway.broadcastToCampaign(campaignId, event, data);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.gateway.broadcastToUser(userId, event, data);
  }

  broadcastToUsers(userIds: string[], event: string, data: any) {
    this.gateway.broadcastToUsers(userIds, event, data);
  }

  // Game-specific broadcasts
  broadcastGameEvent(sessionId: string, gameEvent: any) {
    this.gateway.broadcastGameEvent(sessionId, gameEvent);
  }

  broadcastCombatUpdate(sessionId: string, combatData: any) {
    this.gateway.broadcastCombatUpdate(sessionId, combatData);
  }

  broadcastCharacterUpdate(sessionId: string, characterId: string, updates: any) {
    this.gateway.broadcastCharacterUpdate(sessionId, characterId, updates);
  }

  broadcastDiceRoll(sessionId: string, rollData: any) {
    this.gateway.broadcastDiceRoll(sessionId, rollData);
  }

  broadcastMessage(campaignId: string, message: any) {
    this.gateway.broadcastMessage(campaignId, message);
  }

  // Utility methods
  getConnectedUsers(sessionId: string): string[] {
    return this.gateway.getConnectedUsers(sessionId);
  }

  isUserConnected(userId: string): boolean {
    return this.gateway.isUserConnected(userId);
  }
}

// Made with Bob
