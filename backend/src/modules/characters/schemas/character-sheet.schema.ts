import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CharacterSheetDocument = CharacterSheet & Document;

// Ability Score Components Structure
export interface AbilityScoreColumn {
  type: 'base' | 'race' | 'feats' | 'classes' | 'levels' | 'magic' | 'items' | 'override' | 'maximum';
  scores: [number, number, number, number, number, number, number]; // Str, Dex, Con, Int, Wis, Cha, HoS
}

export interface CurrentStats {
  cols: AbilityScoreColumn[];
}

// Class Structure
export interface CharacterClass {
  classKey: string;
  subclassKey?: string;
  level: number;
  name: string;
  hitDice?: string;
  spellcastingFactor?: number; // 1 = full, 2 = half, 3 = third
}

// Saving Throw Structure
export interface SavingThrow {
  proficient: boolean;
  bonus: number;
}

export interface SavingThrows {
  str: SavingThrow;
  dex: SavingThrow;
  con: SavingThrow;
  int: SavingThrow;
  wis: SavingThrow;
  cha: SavingThrow;
}

// Skill Structure
export interface Skill {
  proficient: boolean;
  expertise: boolean;
  bonus: number;
}

export interface Skills {
  acrobatics: Skill;
  animalHandling: Skill;
  arcana: Skill;
  athletics: Skill;
  deception: Skill;
  history: Skill;
  insight: Skill;
  intimidation: Skill;
  investigation: Skill;
  medicine: Skill;
  nature: Skill;
  perception: Skill;
  performance: Skill;
  persuasion: Skill;
  religion: Skill;
  sleightOfHand: Skill;
  stealth: Skill;
  survival: Skill;
}

// Feature Structure
export interface Feature {
  name: string;
  source: string;
  description: string;
  uses?: {
    max: number;
    current: number;
    resetOn: 'short' | 'long' | 'dawn';
  };
}

// Active Condition Structure
export interface ActiveCondition {
  name: string;
  source?: string;
  duration?: number;
  saveDC?: number;
  saveAbility?: string;
}

// Death Saves Structure
export interface DeathSaves {
  successes: number;
  failures: number;
}

// Concentration Structure
export interface Concentration {
  spellName: string;
  spellLevel: number;
  startedAt: Date;
}

// Current Spell Slots Structure
export interface CurrentSpellSlots {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  level6: number;
  level7: number;
  level8: number;
  level9: number;
}

// Current Hit Dice Structure
export interface CurrentHitDice {
  [diceType: string]: number;
}

// Current Features Structure
export interface CurrentFeature {
  usesRemaining: number;
  maxUses: number;
  resetOn: 'short_rest' | 'long_rest' | 'dawn' | 'manual';
}

export interface CurrentFeatures {
  [featureName: string]: CurrentFeature;
}

// Equipment Structure
export interface EquipmentItem {
  name: string;
  quantity: number;
  weight?: number;
  equipped?: boolean;
  attuned?: boolean;
  description?: string;
}

// Currency Structure
export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

// Spell Slots Structure
export interface SpellSlots {
  [level: number]: {
    max: number;
    used: number;
  };
}

// Attack Structure
export interface Attack {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  range?: string;
  notes?: string;
}

// Source Configuration
export interface SourceConfig {
  allowedSources: string[];
  excludedResources: {
    classes?: string[];
    races?: string[];
    spells?: string[];
    feats?: string[];
    backgrounds?: string[];
  };
}

@Schema({ timestamps: true })
export class CharacterSheet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', index: true })
  campaignId?: Types.ObjectId;

  // Basic Information
  @Prop({ required: true })
  characterName: string;

  @Prop()
  playerName?: string;

  @Prop()
  race?: string;

  @Prop()
  raceVariant?: string;

  @Prop()
  background?: string;

  @Prop()
  alignment?: string;

  @Prop({ default: 0 })
  experiencePoints: number;

  // Core Stats
  @Prop({ default: 1, min: 1, max: 20 })
  level: number;

  @Prop({ default: 2 })
  proficiencyBonus: number;

  // Ability Scores (stored as JSON)
  @Prop({ type: Object, required: true })
  abilityScores: CurrentStats;

  // Classes (stored as JSON array)
  @Prop({ type: [Object], default: [] })
  classes: CharacterClass[];

  // Hit Points
  @Prop({ default: 0 })
  maxHitPoints: number;

  @Prop({ default: 0 })
  currentHitPoints: number;

  @Prop({ default: 0 })
  temporaryHitPoints: number;

  @Prop()
  hitDiceTotal?: string;

  @Prop()
  hitDiceRemaining?: string;

  // Combat Stats
  @Prop({ default: 10 })
  armorClass: number;

  @Prop({ default: 0 })
  initiative: number;

  @Prop({ default: 30 })
  speed: number;

  // Saving Throws
  @Prop({ type: Object, required: true })
  savingThrows: SavingThrows;

  // Skills
  @Prop({ type: Object, required: true })
  skills: Skills;

  // Proficiencies
  @Prop({ type: [String], default: [] })
  armorProficiencies: string[];

  @Prop({ type: [String], default: [] })
  weaponProficiencies: string[];

  @Prop({ type: [String], default: [] })
  toolProficiencies: string[];

  @Prop({ type: [String], default: [] })
  languages: string[];

  // Features and Traits
  @Prop({ type: [Object], default: [] })
  features: Feature[];

  @Prop({ type: [Object], default: [] })
  feats: Feature[];

  // Equipment
  @Prop({ type: [Object], default: [] })
  equipment: EquipmentItem[];

  @Prop({ type: Object, default: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } })
  currency: Currency;

  // Spellcasting
  @Prop()
  spellcastingAbility?: string;

  @Prop()
  spellSaveDC?: number;

  @Prop()
  spellAttackBonus?: number;

  @Prop({ type: Object })
  spellSlots?: SpellSlots;

  @Prop({ type: [String], default: [] })
  spellsKnown: string[];

  @Prop({ type: [String], default: [] })
  spellsPrepared: string[];

  // Attacks
  @Prop({ type: [Object], default: [] })
  attacks: Attack[];

  // Character Details
  @Prop()
  personality?: string;

  @Prop()
  ideals?: string;

  @Prop()
  bonds?: string;

  @Prop()
  flaws?: string;

  @Prop()
  backstory?: string;

  // Appearance
  @Prop()
  age?: number;

  @Prop()
  height?: string;

  @Prop()
  weight?: string;

  @Prop()
  eyes?: string;

  @Prop()
  skin?: string;

  @Prop()
  hair?: string;

  // Settings and Preferences
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  // Custom Content
  @Prop({ type: Object })
  customScripts?: Record<string, any>;

  // Source Configuration
  @Prop({ type: Object, required: true })
  sourcesConfig: SourceConfig;

  // Runtime State Fields
  @Prop({ type: Object })
  currentSpellSlots?: CurrentSpellSlots;

  @Prop({ type: Object, default: {} })
  currentHitDice: CurrentHitDice;

  @Prop({ type: Object, default: {} })
  currentFeatures: CurrentFeatures;

  @Prop({ type: [Object], default: [] })
  activeConditions: ActiveCondition[];

  @Prop({ type: Object, default: { successes: 0, failures: 0 } })
  deathSaves: DeathSaves;

  @Prop({ default: false })
  inCombat: boolean;

  @Prop({ type: Object })
  concentratingOn?: Concentration;

  @Prop({ type: [String], default: [] })
  damageResistances: string[];

  @Prop({ type: [String], default: [] })
  damageImmunities: string[];

  @Prop({ type: [String], default: [] })
  damageVulnerabilities: string[];

  @Prop({ type: Types.ObjectId, ref: 'GameSession' })
  lastSessionId?: Types.ObjectId;

  @Prop()
  lastUpdated: Date;

  // Metadata
  @Prop({ default: '1.0.0' })
  version: string;
}

export const CharacterSheetSchema = SchemaFactory.createForClass(CharacterSheet);

// Add indexes
CharacterSheetSchema.index({ userId: 1 });
CharacterSheetSchema.index({ campaignId: 1 });
CharacterSheetSchema.index({ characterName: 'text' });

// Made with Bob
