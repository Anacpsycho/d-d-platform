// Character Types based on backend schema

export interface AbilityScoreColumn {
  type: 'base' | 'race' | 'feats' | 'classes' | 'levels' | 'magic' | 'items' | 'override' | 'maximum';
  scores: [number, number, number, number, number, number, number]; // Str, Dex, Con, Int, Wis, Cha, HoS
}

export interface CurrentStats {
  cols: AbilityScoreColumn[];
}

export interface CharacterClass {
  classKey: string;
  subclassKey?: string;
  level: number;
  name: string;
  hitDice?: string;
  spellcastingFactor?: number;
}

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

export interface ActiveCondition {
  name: string;
  source?: string;
  duration?: number;
  saveDC?: number;
  saveAbility?: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Concentration {
  spellName: string;
  spellLevel: number;
  startedAt: Date;
}

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

export interface CurrentHitDice {
  [diceType: string]: number;
}

export interface CurrentFeature {
  usesRemaining: number;
  maxUses: number;
  resetOn: 'short_rest' | 'long_rest' | 'dawn' | 'manual';
}

export interface CurrentFeatures {
  [featureName: string]: CurrentFeature;
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  weight?: number;
  equipped?: boolean;
  attuned?: boolean;
  description?: string;
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface SpellSlots {
  [level: number]: {
    max: number;
    used: number;
  };
}

export interface Attack {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  range?: string;
  notes?: string;
}

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

export interface CharacterSheet {
  _id: string;
  userId: string;
  campaignId?: string;
  
  // Basic Information
  characterName: string;
  playerName?: string;
  race?: string;
  raceVariant?: string;
  background?: string;
  alignment?: string;
  experiencePoints: number;
  
  // Core Stats
  level: number;
  proficiencyBonus: number;
  
  // Ability Scores
  abilityScores: CurrentStats;
  
  // Classes
  classes: CharacterClass[];
  
  // Hit Points
  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  hitDiceTotal?: string;
  hitDiceRemaining?: string;
  
  // Combat Stats
  armorClass: number;
  initiative: number;
  speed: number;
  
  // Saving Throws
  savingThrows: SavingThrows;
  
  // Skills
  skills: Skills;
  
  // Proficiencies
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];
  
  // Features and Traits
  features: Feature[];
  feats: Feature[];
  
  // Equipment
  equipment: EquipmentItem[];
  currency: Currency;
  
  // Spellcasting
  spellcastingAbility?: string;
  spellSaveDC?: number;
  spellAttackBonus?: number;
  spellSlots?: SpellSlots;
  spellsKnown: string[];
  spellsPrepared: string[];
  
  // Attacks
  attacks: Attack[];
  
  // Character Details
  personality?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  backstory?: string;
  
  // Appearance
  age?: number;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  
  // Settings
  settings: Record<string, any>;
  customScripts?: Record<string, any>;
  sourcesConfig: SourceConfig;
  
  // Runtime State
  currentSpellSlots?: CurrentSpellSlots;
  currentHitDice: CurrentHitDice;
  currentFeatures: CurrentFeatures;
  activeConditions: ActiveCondition[];
  deathSaves: DeathSaves;
  inCombat: boolean;
  concentratingOn?: Concentration;
  damageResistances: string[];
  damageImmunities: string[];
  damageVulnerabilities: string[];
  
  // Metadata
  lastSessionId?: string;
  lastUpdated: Date;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

// Computed values interface
export interface ComputedAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  honorOrSanity: number;
}

export interface ComputedModifiers {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  honorOrSanity: number;
}

// Made with Bob
