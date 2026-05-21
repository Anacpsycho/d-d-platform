import { IsString, IsOptional, IsNumber, IsArray, IsObject, Min, Max, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentStats, CharacterClass, SourceConfig } from '../schemas/character-sheet.schema';

export class CreateCharacterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  characterName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  playerName?: string;

  @IsString()
  @IsOptional()
  race?: string;

  @IsString()
  @IsOptional()
  raceVariant?: string;

  @IsString()
  @IsOptional()
  background?: string;

  @IsString()
  @IsOptional()
  alignment?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  experiencePoints?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  level?: number;

  @IsObject()
  abilityScores: CurrentStats;

  @IsArray()
  @IsOptional()
  classes?: CharacterClass[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxHitPoints?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  speed?: number;

  @IsArray()
  @IsOptional()
  armorProficiencies?: string[];

  @IsArray()
  @IsOptional()
  weaponProficiencies?: string[];

  @IsArray()
  @IsOptional()
  toolProficiencies?: string[];

  @IsArray()
  @IsOptional()
  languages?: string[];

  @IsString()
  @IsOptional()
  spellcastingAbility?: string;

  @IsArray()
  @IsOptional()
  spellsKnown?: string[];

  @IsString()
  @IsOptional()
  personality?: string;

  @IsString()
  @IsOptional()
  ideals?: string;

  @IsString()
  @IsOptional()
  bonds?: string;

  @IsString()
  @IsOptional()
  flaws?: string;

  @IsString()
  @IsOptional()
  backstory?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  age?: number;

  @IsString()
  @IsOptional()
  height?: string;

  @IsString()
  @IsOptional()
  weight?: string;

  @IsString()
  @IsOptional()
  eyes?: string;

  @IsString()
  @IsOptional()
  skin?: string;

  @IsString()
  @IsOptional()
  hair?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsObject()
  sourcesConfig: SourceConfig;
}

// Made with Bob
