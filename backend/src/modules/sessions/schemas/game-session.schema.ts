import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GameSessionDocument = GameSession & Document;

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class GameSession {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true })
  sessionNumber: number;

  @Prop({ required: true })
  sessionDate: Date;

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  // Partecipanti
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  masterUserId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'CharacterSheet' }], default: [] })
  playerCharacterIds: Types.ObjectId[];

  // Stato sessione
  @Prop({ type: Types.ObjectId, ref: 'CombatEncounter' })
  currentCombatId?: Types.ObjectId;

  @Prop()
  inGameDate?: string;

  @Prop()
  location?: string;

  // Metadata
  @Prop()
  notes?: string;

  @Prop()
  summary?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GameSessionSchema = SchemaFactory.createForClass(GameSession);

// Indexes
GameSessionSchema.index({ campaignId: 1, sessionNumber: 1 });
GameSessionSchema.index({ status: 1 });
GameSessionSchema.index({ sessionDate: 1 });

// Made with Bob
