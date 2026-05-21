import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GameEventDocument = GameEvent & Document;

export enum GameEventType {
  // HP Events
  DAMAGE_TAKEN = 'DAMAGE_TAKEN',
  HEALING_RECEIVED = 'HEALING_RECEIVED',
  TEMP_HP_GAINED = 'TEMP_HP_GAINED',
  TEMP_HP_LOST = 'TEMP_HP_LOST',

  // Rest Events
  SHORT_REST = 'SHORT_REST',
  LONG_REST = 'LONG_REST',

  // Dice Rolls
  ABILITY_CHECK = 'ABILITY_CHECK',
  SAVING_THROW = 'SAVING_THROW',
  ATTACK_ROLL = 'ATTACK_ROLL',
  DAMAGE_ROLL = 'DAMAGE_ROLL',
  SKILL_CHECK = 'SKILL_CHECK',
  INITIATIVE_ROLL = 'INITIATIVE_ROLL',

  // Spell Events
  SPELL_CAST = 'SPELL_CAST',
  SPELL_SLOT_USED = 'SPELL_SLOT_USED',
  SPELL_SLOT_RECOVERED = 'SPELL_SLOT_RECOVERED',
  CONCENTRATION_START = 'CONCENTRATION_START',
  CONCENTRATION_END = 'CONCENTRATION_END',
  CONCENTRATION_CHECK = 'CONCENTRATION_CHECK',

  // Feature Events
  FEATURE_USED = 'FEATURE_USED',
  FEATURE_RECOVERED = 'FEATURE_RECOVERED',

  // Hit Dice Events
  HIT_DICE_USED = 'HIT_DICE_USED',
  HIT_DICE_RECOVERED = 'HIT_DICE_RECOVERED',

  // Combat Events
  COMBAT_STARTED = 'COMBAT_STARTED',
  COMBAT_ENDED = 'COMBAT_ENDED',
  TURN_STARTED = 'TURN_STARTED',
  TURN_ENDED = 'TURN_ENDED',
  ROUND_STARTED = 'ROUND_STARTED',

  // Condition Events
  CONDITION_APPLIED = 'CONDITION_APPLIED',
  CONDITION_REMOVED = 'CONDITION_REMOVED',

  // Death Events
  DEATH_SAVE = 'DEATH_SAVE',
  UNCONSCIOUS = 'UNCONSCIOUS',
  STABILIZED = 'STABILIZED',
  REVIVED = 'REVIVED',
  CHARACTER_DEATH = 'CHARACTER_DEATH',

  // Experience Events
  XP_GAINED = 'XP_GAINED',
  LEVEL_UP = 'LEVEL_UP',

  // Item Events
  ITEM_EQUIPPED = 'ITEM_EQUIPPED',
  ITEM_UNEQUIPPED = 'ITEM_UNEQUIPPED',
  ITEM_USED = 'ITEM_USED',

  // Custom Events
  CUSTOM_EVENT = 'CUSTOM_EVENT',
}

export enum ActorType {
  CHARACTER = 'character',
  NPC = 'npc',
  ENVIRONMENT = 'environment',
  SYSTEM = 'system',
}

export enum TargetType {
  CHARACTER = 'character',
  NPC = 'npc',
  OBJECT = 'object',
}

@Schema({ timestamps: true })
export class GameEvent {
  @Prop({ type: Types.ObjectId, ref: 'GameSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  // Tipo evento
  @Prop({ type: String, enum: GameEventType, required: true })
  eventType: GameEventType;

  // Chi/Cosa
  @Prop({ type: Types.ObjectId })
  actorId?: Types.ObjectId;

  @Prop({ type: String, enum: ActorType, required: true })
  actorType: ActorType;

  @Prop({ type: Types.ObjectId })
  targetId?: Types.ObjectId;

  @Prop({ type: String, enum: TargetType })
  targetType?: TargetType;

  // Dati evento (JSON)
  @Prop({ type: Object, default: {} })
  eventData: Record<string, any>;

  // Risultato calcolato (JSON)
  @Prop({ type: Object, default: {} })
  result: Record<string, any>;

  // Metadata
  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  roundNumber?: number;

  @Prop()
  turnOrder?: number;

  // Rollback
  @Prop({ default: true })
  canRollback: boolean;

  @Prop({ default: false })
  rolledBack: boolean;

  @Prop({ type: Types.ObjectId, ref: 'GameEvent' })
  rollbackEventId?: Types.ObjectId;

  @Prop()
  createdAt: Date;
}

export const GameEventSchema = SchemaFactory.createForClass(GameEvent);

// Indexes
GameEventSchema.index({ sessionId: 1, timestamp: -1 });
GameEventSchema.index({ campaignId: 1, timestamp: -1 });
GameEventSchema.index({ eventType: 1 });
GameEventSchema.index({ targetId: 1, eventType: 1 });
GameEventSchema.index({ actorId: 1, eventType: 1 });

// Made with Bob
