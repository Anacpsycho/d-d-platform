import { create } from 'zustand';
import { CharacterSheet } from '../types/character.types';
import { characterService } from '../services/character.service';

interface CharacterState {
  characters: CharacterSheet[];
  currentCharacter: CharacterSheet | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCharacters: (characters: CharacterSheet[]) => void;
  setCurrentCharacter: (character: CharacterSheet | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  fetchCharacters: () => Promise<void>;
  fetchCharacter: (id: string) => Promise<void>;
  createCharacter: (data: Partial<CharacterSheet>) => Promise<CharacterSheet>;
  updateCharacter: (id: string, data: Partial<CharacterSheet>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  
  // Character Actions
  updateHP: (id: string, currentHP: number, tempHP?: number) => Promise<void>;
  takeDamage: (id: string, damage: number) => Promise<void>;
  heal: (id: string, healing: number) => Promise<void>;
  shortRest: (id: string, hitDiceUsed: Record<string, number>) => Promise<void>;
  longRest: (id: string) => Promise<void>;
  useSpellSlot: (id: string, level: number) => Promise<void>;
  restoreSpellSlot: (id: string, level: number) => Promise<void>;
  addCondition: (id: string, condition: string) => Promise<void>;
  removeCondition: (id: string, condition: string) => Promise<void>;
  
  clearError: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  currentCharacter: null,
  isLoading: false,
  error: null,

  setCharacters: (characters) => set({ characters }),
  
  setCurrentCharacter: (character) => set({ currentCharacter: character }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  fetchCharacters: async () => {
    try {
      set({ isLoading: true, error: null });
      const characters = await characterService.getCharacters();
      set({ characters, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch characters';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchCharacter: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const character = await characterService.getCharacter(id);
      set({ currentCharacter: character, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch character';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createCharacter: async (data: Partial<CharacterSheet>) => {
    try {
      set({ isLoading: true, error: null });
      const character = await characterService.createCharacter(data);
      set((state) => ({
        characters: [...state.characters, character],
        isLoading: false,
      }));
      return character;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create character';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCharacter: async (id: string, data: Partial<CharacterSheet>) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await characterService.updateCharacter(id, data);
      
      set((state) => ({
        characters: state.characters.map((c) => (c._id === id ? updated : c)),
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update character';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteCharacter: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await characterService.deleteCharacter(id);
      
      set((state) => ({
        characters: state.characters.filter((c) => c._id !== id),
        currentCharacter: state.currentCharacter?._id === id ? null : state.currentCharacter,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete character';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateHP: async (id: string, currentHP: number, tempHP?: number) => {
    try {
      const updated = await characterService.updateHP(id, currentHP, tempHP);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update HP';
      set({ error: errorMessage });
      throw error;
    }
  },

  takeDamage: async (id: string, damage: number) => {
    try {
      const updated = await characterService.takeDamage(id, damage);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to apply damage';
      set({ error: errorMessage });
      throw error;
    }
  },

  heal: async (id: string, healing: number) => {
    try {
      const updated = await characterService.heal(id, healing);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to heal';
      set({ error: errorMessage });
      throw error;
    }
  },

  shortRest: async (id: string, hitDiceUsed: Record<string, number>) => {
    try {
      const updated = await characterService.shortRest(id, hitDiceUsed);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to take short rest';
      set({ error: errorMessage });
      throw error;
    }
  },

  longRest: async (id: string) => {
    try {
      const updated = await characterService.longRest(id);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to take long rest';
      set({ error: errorMessage });
      throw error;
    }
  },

  useSpellSlot: async (id: string, level: number) => {
    try {
      const updated = await characterService.useSpellSlot(id, level);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to use spell slot';
      set({ error: errorMessage });
      throw error;
    }
  },

  restoreSpellSlot: async (id: string, level: number) => {
    try {
      const updated = await characterService.restoreSpellSlot(id, level);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to restore spell slot';
      set({ error: errorMessage });
      throw error;
    }
  },

  addCondition: async (id: string, condition: string) => {
    try {
      const updated = await characterService.addCondition(id, condition);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add condition';
      set({ error: errorMessage });
      throw error;
    }
  },

  removeCondition: async (id: string, condition: string) => {
    try {
      const updated = await characterService.removeCondition(id, condition);
      set((state) => ({
        currentCharacter: state.currentCharacter?._id === id ? updated : state.currentCharacter,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove condition';
      set({ error: errorMessage });
      throw error;
    }
  },
}));

// Made with Bob
