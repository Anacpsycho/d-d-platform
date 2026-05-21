import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameEvent, GameEventDocument, GameEventType, ActorType, TargetType } from '../schemas/game-event.schema';
import { CharacterSheet, CharacterSheetDocument } from '../../characters/schemas/character-sheet.schema';

@Injectable()
export class RestService {
  constructor(
    @InjectModel(GameEvent.name)
    private eventModel: Model<GameEventDocument>,
    @InjectModel(CharacterSheet.name)
    private characterModel: Model<CharacterSheetDocument>,
  ) {}

  async shortRest(
    characterId: string,
    hitDiceUsed: { [diceType: string]: number },
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const character = await this.characterModel.findById(characterId).exec();
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const oldHp = character.currentHitPoints;
    let hpRecovered = 0;

    // Calcola HP recuperati dai dadi vita usati
    for (const [diceType, count] of Object.entries(hitDiceUsed)) {
      const conMod = this.getAbilityModifier(character, 'constitution');
      const diceValue = parseInt(diceType.replace('d', ''));
      
      for (let i = 0; i < count; i++) {
        // Simula il tiro del dado (in produzione, questo dovrebbe venire dal client)
        const roll = Math.floor(Math.random() * diceValue) + 1;
        hpRecovered += roll + conMod;
      }

      // Aggiorna dadi vita rimanenti
      if (!character.currentHitDice[diceType]) {
        character.currentHitDice[diceType] = 0;
      }
      character.currentHitDice[diceType] -= count;
    }

    // Applica HP recuperati
    const newHp = Math.min(oldHp + hpRecovered, character.maxHitPoints);
    character.currentHitPoints = newHp;

    // Recupera abilità che si ricaricano con short rest
    const featuresRecovered: string[] = [];
    for (const [featureName, feature] of Object.entries(character.currentFeatures)) {
      if (feature.resetOn === 'short_rest') {
        character.currentFeatures[featureName].usesRemaining = feature.maxUses;
        featuresRecovered.push(featureName);
      }
    }

    await character.save();

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.SHORT_REST,
      actorType: ActorType.CHARACTER,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        hitDiceUsed,
      },
      result: {
        oldHp,
        newHp,
        hpRecovered,
        featuresRecovered,
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false,
    });

    return event.save();
  }

  async longRest(
    characterId: string,
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const character = await this.characterModel.findById(characterId).exec();
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const oldHp = character.currentHitPoints;

    // Recupera tutti gli HP
    character.currentHitPoints = character.maxHitPoints;

    // Recupera metà dei dadi vita (minimo 1)
    const hitDiceRecovered: { [diceType: string]: number } = {};
    for (const classInfo of character.classes) {
      if (classInfo.hitDice) {
        const diceType = classInfo.hitDice;
        const maxDice = classInfo.level;
        const currentDice = character.currentHitDice[diceType] || 0;
        const usedDice = maxDice - currentDice;
        const toRecover = Math.max(1, Math.floor(usedDice / 2));
        
        character.currentHitDice[diceType] = Math.min(
          currentDice + toRecover,
          maxDice,
        );
        hitDiceRecovered[diceType] = toRecover;
      }
    }

    // Recupera tutti gli spell slots
    const spellSlotsRecovered: { [level: string]: number } = {};
    if (character.currentSpellSlots && character.spellSlots) {
      for (let level = 1; level <= 9; level++) {
        const levelKey = `level${level}` as keyof typeof character.currentSpellSlots;
        const maxSlots = character.spellSlots[level]?.max || 0;
        if (maxSlots > 0) {
          const recovered = maxSlots - (character.currentSpellSlots[levelKey] || 0);
          character.currentSpellSlots[levelKey] = maxSlots;
          spellSlotsRecovered[levelKey] = recovered;
        }
      }
    }

    // Recupera tutte le abilità che si ricaricano con long rest
    const featuresRecovered: string[] = [];
    for (const [featureName, feature] of Object.entries(character.currentFeatures)) {
      if (feature.resetOn === 'long_rest' || feature.resetOn === 'short_rest') {
        character.currentFeatures[featureName].usesRemaining = feature.maxUses;
        featuresRecovered.push(featureName);
      }
    }

    // Rimuovi condizioni temporanee (non tutte, solo alcune)
    const conditionsRemoved = character.activeConditions
      .filter((c) => ['Exhaustion'].includes(c.name))
      .map((c) => c.name);
    
    character.activeConditions = character.activeConditions.filter(
      (c) => !conditionsRemoved.includes(c.name),
    );

    // Reset death saves
    character.deathSaves = {
      successes: 0,
      failures: 0,
    };

    await character.save();

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.LONG_REST,
      actorType: ActorType.CHARACTER,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {},
      result: {
        oldHp,
        newHp: character.maxHitPoints,
        hpRecovered: character.maxHitPoints - oldHp,
        hitDiceRecovered,
        spellSlotsRecovered,
        featuresRecovered,
        conditionsRemoved,
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false,
    });

    return event.save();
  }

  private getAbilityModifier(character: CharacterSheetDocument, ability: string): number {
    // Calcola il modificatore dall'ability score
    // Questo è semplificato - in produzione dovrebbe usare il CalculationService
    const abilityIndex = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].indexOf(ability);
    if (abilityIndex === -1) return 0;

    // Somma tutte le colonne per ottenere il punteggio totale
    let totalScore = 0;
    for (const col of character.abilityScores.cols) {
      totalScore += col.scores[abilityIndex];
    }

    return Math.floor((totalScore - 10) / 2);
  }

  async rollbackRest(eventId: string): Promise<void> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event || !event.canRollback || event.rolledBack) {
      throw new Error('Event cannot be rolled back');
    }

    const character = await this.characterModel.findById(event.targetId).exec();
    if (!character) {
      throw new Error('Character not found');
    }

    // Ripristina HP
    character.currentHitPoints = event.result.oldHp;

    // Per un rollback completo, dovremmo ripristinare anche:
    // - Hit dice
    // - Spell slots
    // - Features
    // Ma questo richiede di salvare lo stato precedente nell'evento

    await character.save();

    // Marca evento come rolled back
    event.rolledBack = true;
    await event.save();
  }
}

// Made with Bob
