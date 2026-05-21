import api from './api';
import { CombatEncounter, CombatParticipant } from '../types/session.types';

export const combatService = {
  // Get combat encounter
  async getCombat(id: string): Promise<CombatEncounter> {
    const response = await api.get<CombatEncounter>(`/combat/${id}`);
    return response.data;
  },

  // Start combat
  async startCombat(sessionId: string, participants: Partial<CombatParticipant>[]): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>('/combat/start', {
      sessionId,
      participants,
    });
    return response.data;
  },

  // End combat
  async endCombat(combatId: string): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/end`);
    return response.data;
  },

  // Add participant
  async addParticipant(combatId: string, participant: Partial<CombatParticipant>): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/participants`, participant);
    return response.data;
  },

  // Remove participant
  async removeParticipant(combatId: string, participantId: string): Promise<CombatEncounter> {
    const response = await api.delete<CombatEncounter>(`/combat/${combatId}/participants/${participantId}`);
    return response.data;
  },

  // Update participant
  async updateParticipant(
    combatId: string,
    participantId: string,
    data: Partial<CombatParticipant>
  ): Promise<CombatEncounter> {
    const response = await api.patch<CombatEncounter>(
      `/combat/${combatId}/participants/${participantId}`,
      data
    );
    return response.data;
  },

  // Roll initiative
  async rollInitiative(combatId: string, participantId: string, initiative: number): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/initiative`, {
      participantId,
      initiative,
    });
    return response.data;
  },

  // Next turn
  async nextTurn(combatId: string): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/next-turn`);
    return response.data;
  },

  // Previous turn
  async previousTurn(combatId: string): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/previous-turn`);
    return response.data;
  },

  // Apply damage
  async applyDamage(combatId: string, participantId: string, damage: number): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/damage`, {
      participantId,
      damage,
    });
    return response.data;
  },

  // Apply healing
  async applyHealing(combatId: string, participantId: string, healing: number): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/heal`, {
      participantId,
      healing,
    });
    return response.data;
  },

  // Add condition
  async addCondition(combatId: string, participantId: string, condition: string): Promise<CombatEncounter> {
    const response = await api.post<CombatEncounter>(`/combat/${combatId}/condition`, {
      participantId,
      condition,
    });
    return response.data;
  },

  // Remove condition
  async removeCondition(combatId: string, participantId: string, condition: string): Promise<CombatEncounter> {
    const response = await api.delete<CombatEncounter>(
      `/combat/${combatId}/condition/${participantId}/${condition}`
    );
    return response.data;
  },
};

// Made with Bob
