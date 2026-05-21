import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator';
import { CreateCharacterDto } from './create-character.dto';
import { 
  SavingThrows, 
  Skills, 
  Feature, 
  EquipmentItem, 
  Currency, 
  SpellSlots, 
  Attack 
} from '../schemas/character-sheet.schema';

export class UpdateCharacterDto extends PartialType(CreateCharacterDto) {
  // Additional fields that can be updated but not set on creation
  
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentHitPoints?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  temporaryHitPoints?: number;

  @IsString()
  @IsOptional()
  hitDiceTotal?: string;

  @IsString()
  @IsOptional()
  hitDiceRemaining?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  armorClass?: number;

  @IsNumber()
  @IsOptional()
  initiative?: number;

  @IsObject()
  @IsOptional()
  savingThrows?: SavingThrows;

  @IsObject()
  @IsOptional()
  skills?: Skills;

  @IsArray()
  @IsOptional()
  features?: Feature[];

  @IsArray()
  @IsOptional()
  feats?: Feature[];

  @IsArray()
  @IsOptional()
  equipment?: EquipmentItem[];

  @IsObject()
  @IsOptional()
  currency?: Currency;

  @IsNumber()
  @IsOptional()
  spellSaveDC?: number;

  @IsNumber()
  @IsOptional()
  spellAttackBonus?: number;

  @IsObject()
  @IsOptional()
  spellSlots?: SpellSlots;

  @IsArray()
  @IsOptional()
  spellsPrepared?: string[];

  @IsArray()
  @IsOptional()
  attacks?: Attack[];

  @IsObject()
  @IsOptional()
  customScripts?: Record<string, any>;
}

// Made with Bob
