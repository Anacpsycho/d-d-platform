import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CampaignDocument = Campaign & Document;

export interface CampaignSettings {
  allowMulticlassing: boolean;
  allowFeats: boolean;
  useEncumbrance: boolean;
  hitPointsMethod: 'rolled' | 'average' | 'manual';
  abilityScoreMethod: 'standard' | 'pointBuy' | 'rolled' | 'manual';
  startingLevel: number;
  startingGold: number;
}

export interface SourceMaterial {
  sourceKey: string;
  sourceName: string;
  enabled: boolean;
}

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  masterId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  playerIds: Types.ObjectId[];

  @Prop({ type: Object, required: true })
  settings: CampaignSettings;

  @Prop({ type: [Object], default: [] })
  allowedSources: SourceMaterial[];

  @Prop({ type: Object, default: {} })
  excludedResources: {
    classes?: string[];
    races?: string[];
    spells?: string[];
    feats?: string[];
    backgrounds?: string[];
    items?: string[];
  };

  @Prop({ default: 'active' })
  status: 'active' | 'paused' | 'completed' | 'archived';

  @Prop()
  imageUrl?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);

// Add indexes
CampaignSchema.index({ masterId: 1 });
CampaignSchema.index({ playerIds: 1 });
CampaignSchema.index({ name: 'text', description: 'text' });

// Made with Bob
