import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameEvent, GameEventDocument, GameEventType, ActorType, TargetType } from '../schemas/game-event.schema';

export interface DiceRoll {
  dice: string; // e.g., "2d6+3"
  rolls: number[];
  modifier: number;
  total: number;
}

export interface AdvantageRoll {
  roll1: number;
  roll2: number;
  used: number;
  type: 'advantage' | 'disadvantage' | 'normal';
}

@Injectable()
export class DiceService {
  constructor(
    @InjectModel(GameEvent.name)
    private eventModel: Model<GameEventDocument>,
  ) {}

  rollDice(diceNotation: string): DiceRoll {
    // Parse dice notation (e.g., "2d6+3", "1d20", "3d8-2")
    const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      throw new Error(`Invalid dice notation: ${diceNotation}`);
    }

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

    return {
      dice: diceNotation,
      rolls,
      modifier,
      total,
    };
  }

  rollWithAdvantage(sides: number = 20, type: 'advantage' | 'disadvantage' | 'normal' = 'normal'): AdvantageRoll {
    const roll1 = Math.floor(Math.random() * sides) + 1;
    
    if (type === 'normal') {
      return {
        roll1,
        roll2: roll1,
        used: roll1,
        type: 'normal',
      };
    }

    const roll2 = Math.floor(Math.random() * sides) + 1;
    const used = type === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);

    return {
      roll1,
      roll2,
      used,
      type,
    };
  }

  async recordAbilityCheck(
    characterId: string,
    ability: string,
    dc: number,
    modifier: number,
    advantage: 'advantage' | 'disadvantage' | 'normal',
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const roll = this.rollWithAdvantage(20, advantage);
    const total = roll.used + modifier;
    const success = total >= dc;

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.ABILITY_CHECK,
      actorType: ActorType.CHARACTER,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        ability,
        dc,
        modifier,
        advantage,
      },
      result: {
        roll1: roll.roll1,
        roll2: roll.roll2,
        used: roll.used,
        total,
        success,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    return event.save();
  }

  async recordSavingThrow(
    characterId: string,
    ability: string,
    dc: number,
    modifier: number,
    advantage: 'advantage' | 'disadvantage' | 'normal',
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const roll = this.rollWithAdvantage(20, advantage);
    const total = roll.used + modifier;
    const success = total >= dc;

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.SAVING_THROW,
      actorType: ActorType.CHARACTER,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        ability,
        dc,
        modifier,
        advantage,
      },
      result: {
        roll1: roll.roll1,
        roll2: roll.roll2,
        used: roll.used,
        total,
        success,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    return event.save();
  }

  async recordAttackRoll(
    characterId: string,
    targetId: string,
    attackName: string,
    attackBonus: number,
    advantage: 'advantage' | 'disadvantage' | 'normal',
    targetAC: number,
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const roll = this.rollWithAdvantage(20, advantage);
    const total = roll.used + attackBonus;
    const hit = roll.used === 20 || (roll.used !== 1 && total >= targetAC);
    const criticalHit = roll.used === 20;
    const criticalMiss = roll.used === 1;

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.ATTACK_ROLL,
      actorType: ActorType.CHARACTER,
      actorId: new Types.ObjectId(characterId),
      targetId: new Types.ObjectId(targetId),
      targetType: TargetType.CHARACTER,
      eventData: {
        attackName,
        attackBonus,
        advantage,
        targetAC,
      },
      result: {
        roll1: roll.roll1,
        roll2: roll.roll2,
        used: roll.used,
        total,
        hit,
        criticalHit,
        criticalMiss,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    return event.save();
  }

  async recordDamageRoll(
    characterId: string,
    targetId: string,
    damageFormula: string,
    damageType: string,
    isCritical: boolean,
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    let roll = this.rollDice(damageFormula);

    // Se è un critico, raddoppia i dadi (non il modificatore)
    if (isCritical) {
      const critRoll = this.rollDice(damageFormula);
      roll = {
        dice: `${damageFormula} (critical)`,
        rolls: [...roll.rolls, ...critRoll.rolls],
        modifier: roll.modifier, // Il modificatore non si raddoppia
        total: roll.rolls.reduce((sum, r) => sum + r, 0) + 
               critRoll.rolls.reduce((sum, r) => sum + r, 0) + 
               roll.modifier,
      };
    }

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.DAMAGE_ROLL,
      actorType: ActorType.CHARACTER,
      actorId: new Types.ObjectId(characterId),
      targetId: new Types.ObjectId(targetId),
      targetType: TargetType.CHARACTER,
      eventData: {
        damageFormula,
        damageType,
        isCritical,
      },
      result: {
        rolls: roll.rolls,
        modifier: roll.modifier,
        total: roll.total,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    return event.save();
  }

  async recordSkillCheck(
    characterId: string,
    skill: string,
    dc: number,
    modifier: number,
    advantage: 'advantage' | 'disadvantage' | 'normal',
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const roll = this.rollWithAdvantage(20, advantage);
    const total = roll.used + modifier;
    const success = total >= dc;

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.SKILL_CHECK,
      actorType: ActorType.CHARACTER,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        skill,
        dc,
        modifier,
        advantage,
      },
      result: {
        roll1: roll.roll1,
        roll2: roll.roll2,
        used: roll.used,
        total,
        success,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    return event.save();
  }

  async recordInitiativeRoll(
    characterId: string,
    modifier: number,
    advantage: 'advantage' | 'disadvantage' | 'normal',
    sessionId: string,
    campaignId: string,
  ): Promise<GameEvent> {
    const roll = this.rollWithAdvantage(20, advantage);
    const total = roll.used + modifier;

    const event = new this.eventModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      eventType: GameEventType.INITIATIVE_ROLL,
      actorType: ActorType.CHARACTER,
      targetId: new Types.ObjectId(characterId),
      targetType: TargetType.CHARACTER,
      eventData: {
        modifier,
        advantage,
      },
      result: {
        roll1: roll.roll1,
        roll2: roll.roll2,
        used: roll.used,
        total,
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    return event.save();
  }
}

// Made with Bob
