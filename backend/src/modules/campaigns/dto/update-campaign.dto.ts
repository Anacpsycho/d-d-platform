import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @IsEnum(['active', 'paused', 'completed', 'archived'])
  @IsOptional()
  status?: 'active' | 'paused' | 'completed' | 'archived';
}

// Made with Bob
