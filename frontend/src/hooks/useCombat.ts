import { useEffect, useState, useCallback } from 'react';
import { CombatEncounter, CombatParticipant } from '../types/session.types';
import { combatService } from '../services/combat.service';
import { websocketService } from '../services/websocket.service';

export const useCombat = (combatId?: string) => {
  const [combat, setCombat] = useState<CombatEncounter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch combat
  const fetchCombat = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await combatService.getCombat(id);
      setCombat(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch combat');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start combat
  const startCombat = useCallback(async (sessionId: string, participants: Partial<CombatParticipant>[]) => {
    try {
      const data = await combatService.startCombat(sessionId, participants);
      setCombat(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start combat');
      throw err;
    }
  }, []);

  // End combat
  const endCombat = useCallback(async (id: string) => {
    try {
      const data = await combatService.endCombat(id);
      setCombat(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to end combat');
      throw err;
    }
  }, []);

  // Next turn
  const nextTurn = useCallback(async (id: string) => {
    try {
      const data = await combatService.nextTurn(id);
      setCombat(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to advance turn');
    }
  }, []);

  // Apply damage
  const applyDamage = useCallback(async (id: string, participantId: string, damage: number) => {
    try {
      const data = await combatService.applyDamage(id, participantId, damage);
      setCombat(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to apply damage');
    }
  }, []);

  // Apply healing
  const applyHealing = useCallback(async (id: string, participantId: string, healing: number) => {
    try {
      const data = await combatService.applyHealing(id, participantId, healing);
      setCombat(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to apply healing');
    }
  }, []);

  // Add condition
  const addCondition = useCallback(async (id: string, participantId: string, condition: string) => {
    try {
      const data = await combatService.addCondition(id, participantId, condition);
      setCombat(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add condition');
    }
  }, []);

  // Remove condition
  const removeCondition = useCallback(async (id: string, participantId: string, condition: string) => {
    try {
      const data = await combatService.removeCondition(id, participantId, condition);
      setCombat(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove condition');
    }
  }, []);

  // Join combat via WebSocket
  useEffect(() => {
    if (combatId) {
      fetchCombat(combatId);
      websocketService.joinCombat(combatId);

      // Listen for combat updates
      const handleUpdate = (updatedCombat: CombatEncounter) => {
        setCombat(updatedCombat);
      };

      websocketService.onCombatUpdate(handleUpdate);

      return () => {
        websocketService.offCombatUpdate(handleUpdate);
        websocketService.leaveCombat(combatId);
      };
    }
  }, [combatId, fetchCombat]);

  return {
    combat,
    isLoading,
    error,
    fetchCombat,
    startCombat,
    endCombat,
    nextTurn,
    applyDamage,
    applyHealing,
    addCondition,
    removeCondition,
  };
};

// Made with Bob
