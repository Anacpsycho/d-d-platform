import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CombatEncounterDocument = CombatEncounter & Document;

export enum CombatStatus {
  PREPARING = 'preparing',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum ParticipantType {
  PC = 'pc',
  NPC = 'npc',
  MONSTER = 'monster',
}

export interface CombatParticipant {
  id: string;
  characterId?: string;
  npcId?: string;
  name: string;
  type: ParticipantType;
  
  // Iniziativa
  initiative: number;
  initiativeModifier: number;
  
  // Stato
  isActive: boolean;
  isDefeated: boolean;
  conditions: string[];
  
  // HP tracking
  currentHp: number;
  maxHp: number;
  temporaryHp: number;
  
  // Additional info
  armorClass?: number;
  imageUrl?: string;
}

@Schema({ timestamps: true })
export class CombatEncounter {
  @Prop({ type: Types.ObjectId, ref: 'GameSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  // Stato combattimento
  @Prop({ type: String, enum: CombatStatus, default: CombatStatus.PREPARING })
  status: CombatStatus;

  @Prop({ default: 0 })
  currentRound: number;

  @Prop({ default: 0 })
  currentTurnIndex: number;

  // Partecipanti
  @Prop({ type: [Object], default: [] })
  participants: CombatParticipant[];

  // Metadata
  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop()
  location?: string;

  @Prop()
  description?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CombatEncounterSchema = SchemaFactory.createForClass(CombatEncounter);

// Indexes
CombatEncounterSchema.index({ sessionId: 1 });
CombatEncounterSchema.index({ campaignId: 1 });
CombatEncounterSchema.index({ status: 1 });

// Made with Bob
