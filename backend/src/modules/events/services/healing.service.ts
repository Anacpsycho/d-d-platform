import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameEvent, GameEventDocument, GameEventType, ActorType, TargetType } from '../schemas/game-event.schema';
import { CharacterSheet, CharacterSheetDocument } from '../../characters/schemas/character-sheet.schema';

@Injectable()
export class HealingService {
  constructor(
    @InjectModel(GameEvent.name)
    private eventModel: Model<GameEventDocument>,
    @InjectModel(CharacterSheet.name)
    private characterModel: Model<CharacterSheetDocument>,
  ) {}

  async applyHealing(
    characterId: string,
    healing: number,
    source: string,
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const character = await this.characterModel.findById(characterId).exec();
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const oldHp = character.currentHitPoints;
    const newHp = Math.min(
      character.currentHitPoints + healing,
      character.maxHitPoints,
    );
    const actualHealing = newHp - oldHp;

    character.currentHitPoints = newHp;

    // Se era unconscious e torna > 0, rimuovi condizione
    const wasRevived = oldHp <= 0 && newHp > 0;
    if (wasRevived) {
      await this.handleRevive(character, sessionId, campaignId);
    }

    await character.save();

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.HEALING_RECEIVED,
      actorType: ActorType.CHARACTER,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        potentialHealing: healing,
        source,
      },
      result: {
        actualHealing,
        oldHp,
        newHp,
        wasRevived,
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false,
    });

    return event.save();
  }

  async applyTemporaryHp(
    characterId: string,
    tempHp: number,
    source: string,
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const character = await this.characterModel.findById(characterId).exec();
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    // Temp HP non si sommano, si prende il valore più alto
    const oldTempHp = character.temporaryHitPoints || 0;
    const newTempHp = Math.max(oldTempHp, tempHp);

    character.temporaryHitPoints = newTempHp;
    await character.save();

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.TEMP_HP_GAINED,
      actorType: ActorType.SYSTEM,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        tempHpGained: tempHp,
        source,
      },
      result: {
        oldTempHp,
        newTempHp,
        wasReplaced: newTempHp === tempHp && oldTempHp > 0,
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false,
    });

    return event.save();
  }

  private async handleRevive(
    character: CharacterSheetDocument,
    sessionId: string,
    campaignId: string,
  ): Promise<void> {
    // Rimuovi condizione unconscious
    character.activeConditions = character.activeConditions.filter(
      (c) => c.name !== 'Unconscious',
    );

    // Reset death saves
    character.deathSaves = {
      successes: 0,
      failures: 0,
    };

    // Crea evento revived
    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.REVIVED,
      actorType: ActorType.SYSTEM,
      targetId: character._id,
      targetType: TargetType.CHARACTER,
      eventData: {
        method: 'healing',
      },
      result: {
        currentHp: character.currentHitPoints,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    await event.save();
  }

  async rollbackHealing(eventId: string): Promise<void> {
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

    await character.save();

    // Marca evento come rolled back
    event.rolledBack = true;
    await event.save();
  }
}

// Made with Bob
