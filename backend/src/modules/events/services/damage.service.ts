import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameEvent, GameEventDocument, GameEventType, ActorType, TargetType } from '../schemas/game-event.schema';
import { CharacterSheet, CharacterSheetDocument } from '../../characters/schemas/character-sheet.schema';

export enum DamageType {
  ACID = 'acid',
  BLUDGEONING = 'bludgeoning',
  COLD = 'cold',
  FIRE = 'fire',
  FORCE = 'force',
  LIGHTNING = 'lightning',
  NECROTIC = 'necrotic',
  PIERCING = 'piercing',
  POISON = 'poison',
  PSYCHIC = 'psychic',
  RADIANT = 'radiant',
  SLASHING = 'slashing',
  THUNDER = 'thunder',
}

interface DamageResult {
  newTempHp: number;
  newHp: number;
  tempHpLost: number;
  hpLost: number;
}

@Injectable()
export class DamageService {
  constructor(
    @InjectModel(GameEvent.name)
    private eventModel: Model<GameEventDocument>,
    @InjectModel(CharacterSheet.name)
    private characterModel: Model<CharacterSheetDocument>,
  ) {}

  async applyDamage(
    characterId: string,
    damage: number,
    damageType: DamageType,
    source: string,
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const character = await this.characterModel.findById(characterId).exec();
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    // Calcola danno effettivo con resistenze/immunità/vulnerabilità
    const effectiveDamage = this.calculateEffectiveDamage(character, damage, damageType);

    // Applica danno (prima temp HP, poi HP normali)
    const damageResult = this.applyDamageToHp(
      character.temporaryHitPoints || 0,
      character.currentHitPoints,
      effectiveDamage,
    );

    // Aggiorna character
    character.temporaryHitPoints = damageResult.newTempHp;
    character.currentHitPoints = damageResult.newHp;

    // Verifica unconscious/morte
    const becameUnconscious = character.currentHitPoints <= 0;
    if (becameUnconscious) {
      await this.handleUnconscious(character, sessionId, campaignId);
    }

    // Verifica concentration
    if (character.concentratingOn) {
      await this.checkConcentration(character, effectiveDamage, sessionId, campaignId);
    }

    await character.save();

    // Crea evento
    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.DAMAGE_TAKEN,
      actorType: ActorType.ENVIRONMENT,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        rawDamage: damage,
        damageType,
        source,
        hadResistance: effectiveDamage < damage && effectiveDamage > 0,
        hadVulnerability: effectiveDamage > damage,
        hadImmunity: effectiveDamage === 0,
      },
      result: {
        effectiveDamage,
        tempHpLost: damageResult.tempHpLost,
        hpLost: damageResult.hpLost,
        newTempHp: damageResult.newTempHp,
        newHp: damageResult.newHp,
        becameUnconscious,
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false,
    });

    return event.save();
  }

  private calculateEffectiveDamage(
    character: CharacterSheetDocument,
    damage: number,
    damageType: DamageType,
  ): number {
    // Immunità = 0 danno
    if (character.damageImmunities?.includes(damageType)) {
      return 0;
    }

    // Resistenza = metà danno (arrotondato per difetto)
    if (character.damageResistances?.includes(damageType)) {
      return Math.floor(damage / 2);
    }

    // Vulnerabilità = doppio danno
    if (character.damageVulnerabilities?.includes(damageType)) {
      return damage * 2;
    }

    return damage;
  }

  private applyDamageToHp(
    tempHp: number,
    currentHp: number,
    damage: number,
  ): DamageResult {
    let remainingDamage = damage;
    let newTempHp = tempHp;
    let newHp = currentHp;

    // Prima sottrai da temp HP
    if (tempHp > 0) {
      if (remainingDamage >= tempHp) {
        remainingDamage -= tempHp;
        newTempHp = 0;
      } else {
        newTempHp = tempHp - remainingDamage;
        remainingDamage = 0;
      }
    }

    // Poi sottrai da HP normali
    if (remainingDamage > 0) {
      newHp = currentHp - remainingDamage;
    }

    return {
      newTempHp,
      newHp,
      tempHpLost: tempHp - newTempHp,
      hpLost: currentHp - newHp,
    };
  }

  private async handleUnconscious(
    character: CharacterSheetDocument,
    sessionId: string,
    campaignId: string,
  ): Promise<void> {
    // Aggiungi condizione unconscious
    if (!character.activeConditions) {
      character.activeConditions = [];
    }

    const hasUnconscious = character.activeConditions.some(
      (c) => c.name === 'Unconscious',
    );

    if (!hasUnconscious) {
      character.activeConditions.push({
        name: 'Unconscious',
        source: 'HP dropped to 0',
      });
    }

    // Crea evento unconscious
    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.UNCONSCIOUS,
      actorType: ActorType.SYSTEM,
      targetId: character._id,
      targetType: TargetType.CHARACTER,
      eventData: {
        reason: 'HP dropped to 0 or below',
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

  private async checkConcentration(
    character: CharacterSheetDocument,
    damage: number,
    sessionId: string,
    campaignId: string,
  ): Promise<void> {
    // DC = 10 o metà del danno, quale è più alto
    const dc = Math.max(10, Math.floor(damage / 2));

    // Simula il tiro salvezza (in una vera implementazione, questo dovrebbe essere fatto dal client)
    // Per ora, registriamo solo che è necessario un check
    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.CONCENTRATION_CHECK,
      actorType: ActorType.SYSTEM,
      targetId: character._id,
      targetType: TargetType.CHARACTER,
      eventData: {
        damage,
        dc,
        spell: character.concentratingOn?.spellName,
      },
      result: {
        required: true,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    await event.save();
  }

  async rollbackDamage(eventId: string): Promise<void> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event || !event.canRollback || event.rolledBack) {
      throw new Error('Event cannot be rolled back');
    }

    const character = await this.characterModel.findById(event.targetId).exec();
    if (!character) {
      throw new Error('Character not found');
    }

    // Ripristina HP
    character.currentHitPoints = event.result.newHp + event.result.hpLost;
    character.temporaryHitPoints = event.result.newTempHp + event.result.tempHpLost;

    await character.save();

    // Marca evento come rolled back
    event.rolledBack = true;
    await event.save();
  }
}

// Made with Bob
