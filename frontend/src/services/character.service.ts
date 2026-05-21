import api from './api';
import { CharacterSheet } from '../types/character.types';

export const characterService = {
  // Get all characters for current user
  async getCharacters(): Promise<CharacterSheet[]> {
    const response = await api.get<CharacterSheet[]>('/characters');
    return response.data;
  },

  // Get single character by ID
  async getCharacter(id: string): Promise<CharacterSheet> {
    const response = await api.get<CharacterSheet>(`/characters/${id}`);
    return response.data;
  },

  // Create new character
  async createCharacter(data: Partial<CharacterSheet>): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>('/characters', data);
    return response.data;
  },

  // Update character
  async updateCharacter(id: string, data: Partial<CharacterSheet>): Promise<CharacterSheet> {
    const response = await api.patch<CharacterSheet>(`/characters/${id}`, data);
    return response.data;
  },

  // Delete character
  async deleteCharacter(id: string): Promise<void> {
    await api.delete(`/characters/${id}`);
  },

  // Recalculate character stats
  async recalculateCharacter(id: string): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/recalculate`);
    return response.data;
  },

  // Update HP
  async updateHP(id: string, currentHP: number, tempHP?: number): Promise<CharacterSheet> {
    const response = await api.patch<CharacterSheet>(`/characters/${id}/hp`, {
      currentHitPoints: currentHP,
      temporaryHitPoints: tempHP,
    });
    return response.data;
  },

  // Take damage
  async takeDamage(id: string, damage: number): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/damage`, { damage });
    return response.data;
  },

  // Heal
  async heal(id: string, healing: number): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/heal`, { healing });
    return response.data;
  },

  // Short rest
  async shortRest(id: string, hitDiceUsed: Record<string, number>): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/short-rest`, { hitDiceUsed });
    return response.data;
  },

  // Long rest
  async longRest(id: string): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/long-rest`);
    return response.data;
  },

  // Use spell slot
  async useSpellSlot(id: string, level: number): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/spell-slot/use`, { level });
    return response.data;
  },

  // Restore spell slot
  async restoreSpellSlot(id: string, level: number): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/spell-slot/restore`, { level });
    return response.data;
  },

  // Add condition
  async addCondition(id: string, condition: string): Promise<CharacterSheet> {
    const response = await api.post<CharacterSheet>(`/characters/${id}/condition`, { condition });
    return response.data;
  },

  // Remove condition
  async removeCondition(id: string, condition: string): Promise<CharacterSheet> {
    const response = await api.delete<CharacterSheet>(`/characters/${id}/condition/${condition}`);
    return response.data;
  },

  // Export character
  async exportCharacter(id: string): Promise<Blob> {
    const response = await api.get(`/characters/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import character
  async importCharacter(file: File): Promise<CharacterSheet> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<CharacterSheet>('/characters/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Made with Bob
