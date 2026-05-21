import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CampaignInviteDocument = CampaignInvite & Document;

@Schema({ timestamps: true })
export class CampaignInvite {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  inviteCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: null })
  maxUses?: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: 'active' })
  status: 'active' | 'expired' | 'revoked';

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  usedBy: Types.ObjectId[];
}

export const CampaignInviteSchema = SchemaFactory.createForClass(CampaignInvite);

// Add indexes
CampaignInviteSchema.index({ campaignId: 1 });
CampaignInviteSchema.index({ inviteCode: 1 });
CampaignInviteSchema.index({ expiresAt: 1 });
CampaignInviteSchema.index({ status: 1 });

// Made with Bob
