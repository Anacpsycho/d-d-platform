import { useEffect } from 'react';
import { useCharacterStore } from '../store/characterStore';

export const useCharacter = (characterId?: string) => {
  const {
    characters,
    currentCharacter,
    isLoading,
    error,
    fetchCharacters,
    fetchCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    updateHP,
    takeDamage,
    heal,
    shortRest,
    longRest,
    useSpellSlot,
    restoreSpellSlot,
    addCondition,
    removeCondition,
    clearError,
  } = useCharacterStore();

  // Fetch character on mount if ID provided
  useEffect(() => {
    if (characterId) {
      fetchCharacter(characterId);
    }
  }, [characterId, fetchCharacter]);

  return {
    characters,
    currentCharacter,
    isLoading,
    error,
    fetchCharacters,
    fetchCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    updateHP,
    takeDamage,
    heal,
    shortRest,
    longRest,
    useSpellSlot,
    restoreSpellSlot,
    addCondition,
    removeCondition,
    clearError,
  };
};

// Made with Bob
