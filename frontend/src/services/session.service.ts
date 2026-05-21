import api from './api';
import { GameSession, GameEvent, DiceRoll } from '../types/session.types';

export const sessionService = {
  // Get all sessions for a campaign
  async getSessions(campaignId: string): Promise<GameSession[]> {
    const response = await api.get<GameSession[]>(`/sessions?campaignId=${campaignId}`);
    return response.data;
  },

  // Get single session
  async getSession(id: string): Promise<GameSession> {
    const response = await api.get<GameSession>(`/sessions/${id}`);
    return response.data;
  },

  // Create new session
  async createSession(data: Partial<GameSession>): Promise<GameSession> {
    const response = await api.post<GameSession>('/sessions', data);
    return response.data;
  },

  // Update session
  async updateSession(id: string, data: Partial<GameSession>): Promise<GameSession> {
    const response = await api.patch<GameSession>(`/sessions/${id}`, data);
    return response.data;
  },

  // Start session
  async startSession(id: string): Promise<GameSession> {
    const response = await api.post<GameSession>(`/sessions/${id}/start`);
    return response.data;
  },

  // End session
  async endSession(id: string): Promise<GameSession> {
    const response = await api.post<GameSession>(`/sessions/${id}/end`);
    return response.data;
  },

  // Get session events
  async getSessionEvents(sessionId: string): Promise<GameEvent[]> {
    const response = await api.get<GameEvent[]>(`/sessions/${sessionId}/events`);
    return response.data;
  },

  // Create event
  async createEvent(sessionId: string, event: Partial<GameEvent>): Promise<GameEvent> {
    const response = await api.post<GameEvent>(`/sessions/${sessionId}/events`, event);
    return response.data;
  },

  // Roll dice
  async rollDice(sessionId: string, roll: Partial<DiceRoll>): Promise<DiceRoll> {
    const response = await api.post<DiceRoll>(`/sessions/${sessionId}/roll`, roll);
    return response.data;
  },

  // Get roll history
  async getRollHistory(sessionId: string): Promise<DiceRoll[]> {
    const response = await api.get<DiceRoll[]>(`/sessions/${sessionId}/rolls`);
    return response.data;
  },
};

// Made with Bob
