import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameEvent, GameEventDocument, GameEventType } from './schemas/game-event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(GameEvent.name)
    private eventModel: Model<GameEventDocument>,
  ) {}

  async findBySession(sessionId: string, limit: number = 100): Promise<GameEvent[]> {
    return this.eventModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByCampaign(campaignId: string, limit: number = 100): Promise<GameEvent[]> {
    return this.eventModel
      .find({ campaignId: new Types.ObjectId(campaignId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByCharacter(
    characterId: string,
    eventTypes?: GameEventType[],
    limit: number = 100,
  ): Promise<GameEvent[]> {
    const query: any = {
      $or: [
        { targetId: new Types.ObjectId(characterId) },
        { actorId: new Types.ObjectId(characterId) },
      ],
    };

    if (eventTypes && eventTypes.length > 0) {
      query.eventType = { $in: eventTypes };
    }

    return this.eventModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByType(
    sessionId: string,
    eventType: GameEventType,
    limit: number = 100,
  ): Promise<GameEvent[]> {
    return this.eventModel
      .find({
        sessionId: new Types.ObjectId(sessionId),
        eventType,
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<GameEvent | null> {
    return this.eventModel.findById(id).exec();
  }

  async getCombatEvents(sessionId: string, roundNumber?: number): Promise<GameEvent[]> {
    const query: any = {
      sessionId: new Types.ObjectId(sessionId),
      eventType: {
        $in: [
          GameEventType.COMBAT_STARTED,
          GameEventType.COMBAT_ENDED,
          GameEventType.TURN_STARTED,
          GameEventType.TURN_ENDED,
          GameEventType.ROUND_STARTED,
          GameEventType.ATTACK_ROLL,
          GameEventType.DAMAGE_ROLL,
          GameEventType.DAMAGE_TAKEN,
        ],
      },
    };

    if (roundNumber !== undefined) {
      query.roundNumber = roundNumber;
    }

    return this.eventModel
      .find(query)
      .sort({ timestamp: 1 })
      .exec();
  }

  async getEventStats(sessionId: string): Promise<any> {
    const events = await this.eventModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .exec();

    const stats = {
      totalEvents: events.length,
      byType: {} as Record<string, number>,
      totalDamageDealt: 0,
      totalHealingDone: 0,
      totalRolls: 0,
      criticalHits: 0,
      criticalMisses: 0,
    };

    for (const event of events) {
      // Count by type
      stats.byType[event.eventType] = (stats.byType[event.eventType] || 0) + 1;

      // Aggregate damage
      if (event.eventType === GameEventType.DAMAGE_TAKEN) {
        stats.totalDamageDealt += event.result.effectiveDamage || 0;
      }

      // Aggregate healing
      if (event.eventType === GameEventType.HEALING_RECEIVED) {
        stats.totalHealingDone += event.result.actualHealing || 0;
      }

      // Count rolls
      if ([
        GameEventType.ATTACK_ROLL,
        GameEventType.ABILITY_CHECK,
        GameEventType.SAVING_THROW,
        GameEventType.SKILL_CHECK,
      ].includes(event.eventType)) {
        stats.totalRolls++;
        if (event.result.criticalHit) stats.criticalHits++;
        if (event.result.criticalMiss) stats.criticalMisses++;
      }
    }

    return stats;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.eventModel.findByIdAndDelete(id).exec();
  }

  async deleteSessionEvents(sessionId: string): Promise<void> {
    await this.eventModel.deleteMany({ sessionId: new Types.ObjectId(sessionId) }).exec();
  }
}

// Made with Bob
