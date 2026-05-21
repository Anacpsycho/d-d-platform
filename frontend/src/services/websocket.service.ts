import { io, Socket } from 'socket.io-client';
import { GameEvent, Message, CombatEncounter } from '../types/session.types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Session Events
  joinSession(sessionId: string): void {
    this.socket?.emit('session:join', { sessionId });
  }

  leaveSession(sessionId: string): void {
    this.socket?.emit('session:leave', { sessionId });
  }

  onSessionEvent(callback: (event: GameEvent) => void): void {
    this.socket?.on('session:event', callback);
  }

  offSessionEvent(callback: (event: GameEvent) => void): void {
    this.socket?.off('session:event', callback);
  }

  // Combat Events
  joinCombat(combatId: string): void {
    this.socket?.emit('combat:join', { combatId });
  }

  leaveCombat(combatId: string): void {
    this.socket?.emit('combat:leave', { combatId });
  }

  onCombatUpdate(callback: (combat: CombatEncounter) => void): void {
    this.socket?.on('combat:update', callback);
  }

  offCombatUpdate(callback: (combat: CombatEncounter) => void): void {
    this.socket?.off('combat:update', callback);
  }

  onInitiativeRolled(callback: (data: any) => void): void {
    this.socket?.on('combat:initiative', callback);
  }

  onTurnChanged(callback: (data: any) => void): void {
    this.socket?.on('combat:turn', callback);
  }

  onParticipantUpdated(callback: (data: any) => void): void {
    this.socket?.on('combat:participant', callback);
  }

  // Messaging Events
  joinCampaignChat(campaignId: string): void {
    this.socket?.emit('chat:join', { campaignId });
  }

  leaveCampaignChat(campaignId: string): void {
    this.socket?.emit('chat:leave', { campaignId });
  }

  sendMessage(message: Partial<Message>): void {
    this.socket?.emit('chat:message', message);
  }

  onMessage(callback: (message: Message) => void): void {
    this.socket?.on('chat:message', callback);
  }

  offMessage(callback: (message: Message) => void): void {
    this.socket?.off('chat:message', callback);
  }

  onTyping(callback: (data: { userId: string; userName: string; isTyping: boolean }) => void): void {
    this.socket?.on('chat:typing', callback);
  }

  sendTyping(campaignId: string, isTyping: boolean): void {
    this.socket?.emit('chat:typing', { campaignId, isTyping });
  }

  // Dice Roll Events
  onDiceRoll(callback: (roll: any) => void): void {
    this.socket?.on('dice:roll', callback);
  }

  offDiceRoll(callback: (roll: any) => void): void {
    this.socket?.off('dice:roll', callback);
  }

  // Character Updates
  onCharacterUpdate(callback: (data: any) => void): void {
    this.socket?.on('character:update', callback);
  }

  offCharacterUpdate(callback: (data: any) => void): void {
    this.socket?.off('character:update', callback);
  }

  // HP Updates
  onHPUpdate(callback: (data: { characterId: string; currentHp: number; maxHp: number; tempHp: number }) => void): void {
    this.socket?.on('character:hp', callback);
  }

  // Condition Updates
  onConditionUpdate(callback: (data: { characterId: string; conditions: string[] }) => void): void {
    this.socket?.on('character:condition', callback);
  }

  // Generic emit
  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  // Generic listener
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // Connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();

// Made with Bob
