import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NPCDocument = NPC & Document;

export enum NPCType {
  FRIENDLY = 'friendly',
  NEUTRAL = 'neutral',
  HOSTILE = 'hostile',
  ALLY = 'ally',
}

export interface NPCAttack {
  name: string;
  attackBonus: number;
  damageFormula: string;
  damageType: string;
}

export interface NPCHitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface NPCAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

@Schema({ timestamps: true })
export class NPC {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  // Basic info
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: NPCType, default: NPCType.NEUTRAL })
  type: NPCType;

  @Prop()
  race?: string;

  @Prop()
  class?: string;

  // Stats
  @Prop()
  level?: number;

  @Prop({ required: true })
  armorClass: number;

  @Prop({ type: Object, required: true })
  hitPoints: NPCHitPoints;

  // Abilities
  @Prop({ type: Object, required: true })
  abilityScores: NPCAbilityScores;

  // Combat
  @Prop({ default: 0 })
  initiative: number;

  @Prop({ default: 30 })
  speed: number;

  @Prop({ type: [Object], default: [] })
  attacks: NPCAttack[];

  // Features
  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  spells?: string[];

  // Notes
  @Prop()
  description?: string;

  @Prop()
  notes?: string;

  @Prop()
  imageUrl?: string;

  // Visibility
  @Prop({ default: false })
  visibleToPlayers: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const NPCSchema = SchemaFactory.createForClass(NPC);

// Indexes
NPCSchema.index({ campaignId: 1 });
NPCSchema.index({ name: 'text' });
NPCSchema.index({ type: 1 });

// Made with Bob
