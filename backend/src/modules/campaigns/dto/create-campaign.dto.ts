import { IsString, IsOptional, IsObject, IsArray, IsEnum, IsNumber, Min, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignSettings, SourceMaterial } from '../schemas/campaign.schema';

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsObject()
  settings: CampaignSettings;

  @IsArray()
  @IsOptional()
  allowedSources?: SourceMaterial[];

  @IsObject()
  @IsOptional()
  excludedResources?: {
    classes?: string[];
    races?: string[];
    spells?: string[];
    feats?: string[];
    backgrounds?: string[];
    items?: string[];
  };

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Made with Bob
