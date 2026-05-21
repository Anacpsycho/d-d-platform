import { Injectable } from '@nestjs/common';
import { CombatParticipant } from '../schemas/combat-encounter.schema';

@Injectable()
export class InitiativeService {
  /**
   * Ordina i partecipanti per iniziativa (decrescente)
   * In caso di parità, usa il modificatore di iniziativa
   */
  sortByInitiative(participants: CombatParticipant[]): CombatParticipant[] {
    return [...participants].sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      // In caso di parità, usa il modificatore
      return b.initiativeModifier - a.initiativeModifier;
    });
  }

  /**
   * Trova il prossimo partecipante attivo (non sconfitto)
   */
  findNextActiveParticipant(
    participants: CombatParticipant[],
    currentIndex: number,
  ): { index: number; participant: CombatParticipant | null } {
    const totalParticipants = participants.length;
    let nextIndex = (currentIndex + 1) % totalParticipants;
    let attempts = 0;

    while (attempts < totalParticipants) {
      const participant = participants[nextIndex];
      if (!participant.isDefeated) {
        return { index: nextIndex, participant };
      }
      nextIndex = (nextIndex + 1) % totalParticipants;
      attempts++;
    }

    return { index: -1, participant: null };
  }

  /**
   * Verifica se è iniziato un nuovo round
   */
  isNewRound(currentIndex: number, nextIndex: number): boolean {
    return nextIndex <= currentIndex;
  }

  /**
   * Calcola il modificatore di iniziativa dalla destrezza
   */
  calculateInitiativeModifier(dexterity: number): number {
    return Math.floor((dexterity - 10) / 2);
  }

  /**
   * Tira l'iniziativa per un partecipante
   */
  rollInitiative(modifier: number): number {
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + modifier;
  }

  /**
   * Verifica se tutti i partecipanti sono sconfitti
   */
  areAllDefeated(participants: CombatParticipant[]): boolean {
    return participants.every((p) => p.isDefeated);
  }

  /**
   * Conta i partecipanti attivi (non sconfitti)
   */
  countActiveParticipants(participants: CombatParticipant[]): number {
    return participants.filter((p) => !p.isDefeated).length;
  }

  /**
   * Ottieni il partecipante corrente
   */
  getCurrentParticipant(
    participants: CombatParticipant[],
    currentIndex: number,
  ): CombatParticipant | null {
    if (currentIndex < 0 || currentIndex >= participants.length) {
      return null;
    }
    return participants[currentIndex];
  }

  /**
   * Trova un partecipante per ID
   */
  findParticipantById(
    participants: CombatParticipant[],
    participantId: string,
  ): CombatParticipant | null {
    return participants.find((p) => p.id === participantId) || null;
  }

  /**
   * Ottieni l'ordine di iniziativa come array di nomi
   */
  getInitiativeOrder(participants: CombatParticipant[]): string[] {
    return this.sortByInitiative(participants).map((p) => p.name);
  }
}

// Made with Bob
