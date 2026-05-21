# D&D Character Sheet - Complete Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing a complete D&D 5E Character Sheet web application with strict separation between frontend, backend, and database layers.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Database Schema](#database-schema)
3. [Backend Services](#backend-services)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Calculation Logic](#calculation-logic)
7. [External Data Integration](#external-data-integration)
8. [Implementation Phases](#implementation-phases)

---

## 1. Technology Stack

### Recommended Stack

**Backend:**
- Node.js with TypeScript
- Express.js or NestJS
- Prisma ORM
- PostgreSQL database
- JWT authentication

**Frontend:**
- React with TypeScript
- Redux or Zustand for state management
- React Hook Form for form handling
- Tailwind CSS for styling
- Axios for API calls

**External Integration:**
- Google Sheets API for reference data
- Cron jobs for periodic sync

---

## 2. Database Schema

### 2.1 Complete Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id            String          @id @default(uuid())
  email         String          @unique
  username      String          @unique
  passwordHash  String
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  characterSheets CharacterSheet[]
  
  @@map("users")
}

// ============================================
// CHARACTER SHEET
// ============================================

model CharacterSheet {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Basic Information
  characterName   String
  playerName      String?
  race            String?
  raceVariant     String?
  background      String?
  alignment       String?
  experiencePoints Int      @default(0)
  
  // Core Stats
  level           Int       @default(1)
  proficiencyBonus Int      @default(2)
  
  // Ability Scores (stored as JSON for flexibility)
  abilityScores   Json      // CurrentStats structure
  
  // Classes (stored as JSON array)
  classes         Json      // Array of {classKey, subclassKey, level, name}
  
  // Hit Points
  maxHitPoints    Int       @default(0)
  currentHitPoints Int      @default(0)
  temporaryHitPoints Int    @default(0)
  hitDiceTotal    String?   // e.g., "3d8+2d6"
  hitDiceRemaining String?
  
  // Combat Stats
  armorClass      Int       @default(10)
  initiative      Int       @default(0)
  speed           Int       @default(30)
  
  // Saving Throws (stored as JSON)
  savingThrows    Json      // {str: {proficient, bonus}, dex: {...}, ...}
  
  // Skills (stored as JSON)
  skills          Json      // {acrobatics: {proficient, expertise, bonus}, ...}
  
  // Proficiencies
  armorProficiencies    String[]
  weaponProficiencies   String[]
  toolProficiencies     String[]
  languages             String[]
  
  // Features and Traits
  features        Json      // Array of feature objects
  feats           Json      // Array of feat objects
  
  // Equipment
  equipment       Json      // Detailed equipment list
  currency        Json      // {cp, sp, ep, gp, pp}
  
  // Spellcasting
  spellcastingAbility String?
  spellSaveDC     Int?
  spellAttackBonus Int?
  spellSlots      Json?     // {1: {max: 4, used: 2}, 2: {...}, ...}
  spellsKnown     Json?     // Array of spell keys
  spellsPrepared  Json?     // Array of spell keys
  
  // Attacks
  attacks         Json      // Array of attack objects
  
  // Character Details
  personality     String?
  ideals          String?
  bonds           String?
  flaws           String?
  backstory       String?
  
  // Appearance
  age             Int?
  height          String?
  weight          String?
  eyes            String?
  skin            String?
  hair            String?
  
  // Settings and Preferences
  settings        Json      // User preferences for this sheet
  
  // Custom Content
  customScripts   Json?     // User-imported custom scripts
  
  // Source Configuration
  sourcesConfig   Json      // CurrentSources structure
  
  // Metadata
  version         String    @default("1.0.0")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  companions      Companion[]
  
  @@map("character_sheets")
  @@index([userId])
}

// ============================================
// COMPANION
// ============================================

model Companion {
  id              String          @id @default(uuid())
  characterSheetId String
  characterSheet  CharacterSheet  @relation(fields: [characterSheetId], references: [id], onDelete: Cascade)
  
  name            String
  type            String          // "beast", "familiar", etc.
  stats           Json            // Complete companion stats
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@map("companions")
  @@index([characterSheetId])
}

// ============================================
// REFERENCE DATA (from Google Sheets)
// ============================================

model ReferenceClass {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  source          String
  hitDie          Int
  primaryAbility  String
  saves           String[]
  data            Json      // Complete class data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_classes")
}

model ReferenceSubclass {
  id              String    @id @default(uuid())
  key             String    @unique
  classKey        String
  name            String
  subname         String
  source          String
  data            Json      // Complete subclass data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_subclasses")
  @@index([classKey])
}

model ReferenceRace {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  source          String
  abilityScores   Json
  size            String
  speed           Int
  data            Json      // Complete race data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_races")
}

model ReferenceSpell {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  level           Int
  school          String
  castingTime     String
  range           String
  components      String
  duration        String
  classes         String[]
  source          String
  description     String
  data            Json      // Complete spell data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_spells")
  @@index([level])
  @@index([school])
}

model ReferenceFeat {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  source          String
  prerequisite    String?
  data            Json      // Complete feat data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_feats")
}

model ReferenceBackground {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  source          String
  skillProficiencies String[]
  data            Json      // Complete background data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_backgrounds")
}

model ReferenceMagicItem {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  type            String
  rarity          String
  attunement      Boolean
  source          String
  description     String
  data            Json      // Complete magic item data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_magic_items")
  @@index([type])
  @@index([rarity])
}

model ReferenceWeapon {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  type            String    // "simple melee", "martial ranged", etc.
  damage          String
  damageType      String
  properties      String[]
  weight          Float?
  cost            String?
  source          String
  data            Json      // Complete weapon data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_weapons")
  @@index([type])
}

model ReferenceArmor {
  id              String    @id @default(uuid())
  key             String    @unique
  name            String
  type            String    // "light", "medium", "heavy", "shield"
  ac              String    // e.g., "11 + Dex modifier"
  strength        Int?      // Strength requirement
  stealth         Boolean   // Disadvantage on stealth
  weight          Float?
  cost            String?
  source          String
  data            Json      // Complete armor data
  
  lastSyncedAt    DateTime  @default(now())
  
  @@map("reference_armors")
  @@index([type])
}

// ============================================
// SYNC TRACKING
// ============================================

model SyncLog {
  id              String    @id @default(uuid())
  entityType      String    // "class", "spell", "race", etc.
  syncedAt        DateTime  @default(now())
  recordsUpdated  Int
  success         Boolean
  errorMessage    String?
  
  @@map("sync_logs")
  @@index([entityType, syncedAt])
}
```

---

## 3. Backend Services

### 3.1 Ability Score Calculation Service

```typescript
// services/abilityScoreService.ts

interface AbilityScoreComponents {
  base: number;
  racial: number;
  feats: number;
  classes: number;
  levels: number;
  magic: number;
  items: number;
  override: number;
  maximum: number;
}

interface CurrentStats {
  cols: Array<{
    type: 'base' | 'race' | 'feats' | 'classes' | 'levels' | 'magic' | 'items' | 'override' | 'maximum';
    scores: [number, number, number, number, number, number, number]; // Str, Dex, Con, Int, Wis, Cha, HoS
  }>;
}

export class AbilityScoreService {
  /**
   * Calculate final ability score from all components
   */
  calculateAbilityScore(stats: CurrentStats, abilityIndex: number): number {
    const override = this.getScoreByType(stats, 'override', abilityIndex);
    const maximum = this.getScoreByType(stats, 'maximum', abilityIndex);
    
    // If override is set, use it (capped by maximum)
    if (override > 0) {
      return Math.min(override, maximum);
    }
    
    // Otherwise, sum all components except override and maximum
    let total = 0;
    for (const col of stats.cols) {
      if (col.type !== 'override' && col.type !== 'maximum') {
        total += col.scores[abilityIndex];
      }
    }
    
    // Cap at maximum
    return Math.min(total, maximum);
  }
  
  /**
   * Calculate ability modifier from score
   */
  calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }
  
  /**
   * Get all ability scores and modifiers
   */
  getAllAbilityScores(stats: CurrentStats): Record<string, {score: number, modifier: number}> {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'hos'];
    const result: Record<string, {score: number, modifier: number}> = {};
    
    abilities.forEach((ability, index) => {
      const score = this.calculateAbilityScore(stats, index);
      result[ability] = {
        score,
        modifier: this.calculateModifier(score)
      };
    });
    
    return result;
  }
  
  /**
   * Update ability score component
   */
  updateAbilityScoreComponent(
    stats: CurrentStats,
    type: string,
    abilityIndex: number,
    value: number
  ): CurrentStats {
    const newStats = JSON.parse(JSON.stringify(stats)); // Deep clone
    const col = newStats.cols.find(c => c.type === type);
    
    if (col) {
      col.scores[abilityIndex] = value;
    }
    
    return newStats;
  }
  
  /**
   * Calculate point buy value
   */
  calculatePointBuy(stats: CurrentStats): number {
    const costs: Record<number, number> = {
      8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
    };
    
    let total = 0;
    const baseCol = stats.cols.find(c => c.type === 'base');
    
    if (baseCol) {
      for (let i = 0; i < 6; i++) { // First 6 abilities (not HoS)
        const score = baseCol.scores[i];
        total += costs[score] || 0;
      }
    }
    
    return total;
  }
  
  private getScoreByType(stats: CurrentStats, type: string, index: number): number {
    const col = stats.cols.find(c => c.type === type);
    return col ? col.scores[index] : 0;
  }
}
```

### 3.2 Proficiency Bonus Service

```typescript
// services/proficiencyService.ts

export class ProficiencyService {
  /**
   * Calculate proficiency bonus based on character level
   */
  calculateProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  }
  
  /**
   * Calculate skill modifier
   */
  calculateSkillModifier(
    abilityModifier: number,
    proficient: boolean,
    expertise: boolean,
    proficiencyBonus: number,
    additionalBonus: number = 0
  ): number {
    let modifier = abilityModifier + additionalBonus;
    
    if (expertise) {
      modifier += proficiencyBonus * 2;
    } else if (proficient) {
      modifier += proficiencyBonus;
    }
    
    return modifier;
  }
  
  /**
   * Calculate saving throw modifier
   */
  calculateSavingThrowModifier(
    abilityModifier: number,
    proficient: boolean,
    proficiencyBonus: number,
    additionalBonus: number = 0
  ): number {
    let modifier = abilityModifier + additionalBonus;
    
    if (proficient) {
      modifier += proficiencyBonus;
    }
    
    return modifier;
  }
}
```

### 3.3 Spell Slot Calculation Service

```typescript
// services/spellSlotService.ts

interface SpellcastingClass {
  classKey: string;
  level: number;
  spellcastingFactor: number; // 1 for full caster, 2 for half, 3 for third
}

export class SpellSlotService {
  // Spell slots per level for full casters
  private readonly FULL_CASTER_SLOTS = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // Level 0
    [2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
    [3, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
    [4, 2, 0, 0, 0, 0, 0, 0, 0], // Level 3
    [4, 3, 0, 0, 0, 0, 0, 0, 0], // Level 4
    [4, 3, 2, 0, 0, 0, 0, 0, 0], // Level 5
    [4, 3, 3, 0, 0, 0, 0, 0, 0], // Level 6
    [4, 3, 3, 1, 0, 0, 0, 0, 0], // Level 7
    [4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
    [4, 3, 3, 3, 1, 0, 0, 0, 0], // Level 9
    [4, 3, 3, 3, 2, 0, 0, 0, 0], // Level 10
    [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 11
    [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 12
    [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 13
    [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 14
    [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 15
    [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 16
    [4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
    [4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
    [4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
    [4, 3, 3, 3, 3, 2, 2, 1, 1], // Level 20
  ];
  
  /**
   * Calculate spell slots for multiclass characters
   */
  calculateSpellSlots(spellcastingClasses: SpellcastingClass[]): Record<number, number> {
    // Calculate effective caster level
    let effectiveLevel = 0;
    
    for (const sc of spellcastingClasses) {
      if (sc.spellcastingFactor === 1) {
        // Full caster
        effectiveLevel += sc.level;
      } else if (sc.spellcastingFactor === 2) {
        // Half caster (Paladin, Ranger)
        effectiveLevel += Math.floor(sc.level / 2);
      } else if (sc.spellcastingFactor === 3) {
        // Third caster (Eldritch Knight, Arcane Trickster)
        effectiveLevel += Math.floor(sc.level / 3);
      }
    }
    
    // Cap at level 20
    effectiveLevel = Math.min(effectiveLevel, 20);
    
    // Get spell slots for effective level
    const slots = this.FULL_CASTER_SLOTS[effectiveLevel];
    
    // Convert to object
    const result: Record<number, number> = {};
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] > 0) {
        result[i + 1] = slots[i];
      }
    }
    
    return result;
  }
  
  /**
   * Calculate spell save DC
   */
  calculateSpellSaveDC(
    spellcastingAbilityModifier: number,
    proficiencyBonus: number,
    additionalBonus: number = 0
  ): number {
    return 8 + spellcastingAbilityModifier + proficiencyBonus + additionalBonus;
  }
  
  /**
   * Calculate spell attack bonus
   */
  calculateSpellAttackBonus(
    spellcastingAbilityModifier: number,
    proficiencyBonus: number,
    additionalBonus: number = 0
  ): number {
    return spellcastingAbilityModifier + proficiencyBonus + additionalBonus;
  }
}
```

### 3.4 Character Calculation Service (Main Orchestrator)

```typescript
// services/characterCalculationService.ts

export class CharacterCalculationService {
  constructor(
    private abilityScoreService: AbilityScoreService,
    private proficiencyService: ProficiencyService,
    private spellSlotService: SpellSlotService
  ) {}
  
  /**
   * Recalculate all derived values for a character
   */
  async recalculateCharacter(characterSheet: CharacterSheet): Promise<CharacterSheet> {
    // 1. Calculate proficiency bonus
    characterSheet.proficiencyBonus = this.proficiencyService.calculateProficiencyBonus(
      characterSheet.level
    );
    
    // 2. Calculate ability scores and modifiers
    const abilityScores = this.abilityScoreService.getAllAbilityScores(
      characterSheet.abilityScores as CurrentStats
    );
    
    // 3. Calculate saving throws
    characterSheet.savingThrows = this.calculateSavingThrows(
      abilityScores,
      characterSheet.savingThrows as any,
      characterSheet.proficiencyBonus
    );
    
    // 4. Calculate skills
    characterSheet.skills = this.calculateSkills(
      abilityScores,
      characterSheet.skills as any,
      characterSheet.proficiencyBonus
    );
    
    // 5. Calculate AC (if not manually set)
    characterSheet.armorClass = await this.calculateAC(characterSheet, abilityScores);
    
    // 6. Calculate initiative
    characterSheet.initiative = abilityScores.dex.modifier;
    
    // 7. Calculate spell slots if spellcaster
    if (this.isSpellcaster(characterSheet)) {
      const spellcastingClasses = this.getSpellcastingClasses(characterSheet);
      characterSheet.spellSlots = this.spellSlotService.calculateSpellSlots(spellcastingClasses);
      
      // Calculate spell save DC and attack bonus
      const spellcastingAbility = this.getSpellcastingAbility(characterSheet);
      const abilityMod = abilityScores[spellcastingAbility].modifier;
      
      characterSheet.spellSaveDC = this.spellSlotService.calculateSpellSaveDC(
        abilityMod,
        characterSheet.proficiencyBonus
      );
      
      characterSheet.spellAttackBonus = this.spellSlotService.calculateSpellAttackBonus(
        abilityMod,
        characterSheet.proficiencyBonus
      );
    }
    
    return characterSheet;
  }
  
  private calculateSavingThrows(
    abilityScores: Record<string, {score: number, modifier: number}>,
    currentSaves: any,
    proficiencyBonus: number
  ): any {
    const saves: any = {};
    
    for (const [ability, scores] of Object.entries(abilityScores)) {
      if (ability === 'hos') continue; // Skip Honor/Sanity
      
      const proficient = currentSaves[ability]?.proficient || false;
      const bonus = currentSaves[ability]?.bonus || 0;
      
      saves[ability] = {
        proficient,
        bonus,
        total: this.proficiencyService.calculateSavingThrowModifier(
          scores.modifier,
          proficient,
          proficiencyBonus,
          bonus
        )
      };
    }
    
    return saves;
  }
  
  private calculateSkills(
    abilityScores: Record<string, {score: number, modifier: number}>,
    currentSkills: any,
    proficiencyBonus: number
  ): any {
    const skillAbilities: Record<string, string> = {
      acrobatics: 'dex',
      animalHandling: 'wis',
      arcana: 'int',
      athletics: 'str',
      deception: 'cha',
      history: 'int',
      insight: 'wis',
      intimidation: 'cha',
      investigation: 'int',
      medicine: 'wis',
      nature: 'int',
      perception: 'wis',
      performance: 'cha',
      persuasion: 'cha',
      religion: 'int',
      sleightOfHand: 'dex',
      stealth: 'dex',
      survival: 'wis'
    };
    
    const skills: any = {};
    
    for (const [skill, ability] of Object.entries(skillAbilities)) {
      const proficient = currentSkills[skill]?.proficient || false;
      const expertise = currentSkills[skill]?.expertise || false;
      const bonus = currentSkills[skill]?.bonus || 0;
      
      skills[skill] = {
        proficient,
        expertise,
        bonus,
        total: this.proficiencyService.calculateSkillModifier(
          abilityScores[ability].modifier,
          proficient,
          expertise,
          proficiencyBonus,
          bonus
        )
      };
    }
    
    return skills;
  }
  
  private async calculateAC(
    characterSheet: CharacterSheet,
    abilityScores: Record<string, {score: number, modifier: number}>
  ): Promise<number> {
    // This is simplified - actual implementation would check equipped armor
    // For now, return unarmored AC: 10 + Dex modifier
    return 10 + abilityScores.dex.modifier;
  }
  
  private isSpellcaster(characterSheet: CharacterSheet): boolean {
    const classes = characterSheet.classes as any[];
    // Check if any class has spellcasting
    // This would need to query the reference data
    return false; // Placeholder
  }
  
  private getSpellcastingClasses(characterSheet: CharacterSheet): SpellcastingClass[] {
    // Extract spellcasting classes from character's classes
    // This would need to query the reference data
    return []; // Placeholder
  }
  
  private getSpellcastingAbility(characterSheet: CharacterSheet): string {
    return characterSheet.spellcastingAbility || 'int';
  }
}
```

---

## 4. API Endpoints

### 4.1 Character Sheet Endpoints

```typescript
// routes/characterSheets.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create new character sheet
router.post('/', authenticate, async (req, res) => {
  // POST /api/character-sheets
  // Body: { characterName, race, background, ... }
});

// Get all character sheets for user
router.get('/', authenticate, async (req, res) => {
  // GET /api/character-sheets
});

// Get specific character sheet
router.get('/:id', authenticate, async (req, res) => {
  // GET /api/character-sheets/:id
});

// Update character sheet
router.put('/:id', authenticate, async (req, res) => {
  // PUT /api/character-sheets/:id
  // Body: { field updates }
});

// Delete character sheet
router.delete('/:id', authenticate, async (req, res) => {
  // DELETE /api/character-sheets/:id
});

// Recalculate character sheet
router.post('/:id/recalculate', authenticate, async (req, res) => {
  // POST /api/character-sheets/:id/recalculate
  // Triggers full recalculation of all derived values
});

// Update ability scores
router.put('/:id/ability-scores', authenticate, async (req, res) => {
  // PUT /api/character-sheets/:id/ability-scores
  // Body: { abilityScores: CurrentStats }
});

// Update classes
router.put('/:id/classes', authenticate, async (req, res) => {
  // PUT /api/character-sheets/:id/classes
  // Body: { classes: [{classKey, subclassKey, level}] }
});

// Add/remove feat
router.post('/:id/feats', authenticate, async (req, res) => {
  // POST /api/character-sheets/:id/feats
  // Body: { featKey, options }
});

router.delete('/:id/feats/:featKey', authenticate, async (req, res) => {
  // DELETE /api/character-sheets/:id/feats/:featKey
});

// Update equipment
router.put('/:id/equipment', authenticate, async (req, res) => {
  // PUT /api/character-sheets/:id/equipment
  // Body: { equipment: [...] }
});

// Update spells
router.put('/:id/spells', authenticate, async (req, res) => {
  // PUT /api/character-sheets/:id/spells
  // Body: { spellsKnown, spellsPrepared }
});

export default router;
```

### 4.2 Reference Data Endpoints

```typescript
// routes/reference.ts

import { Router } from 'express';

const router = Router();

// Get all classes
router.get('/classes', async (req, res) => {
  // GET /api/reference/classes
  // Query params: ?source=PHB&excludeSources=UA:RR
});

// Get specific class
router.get('/classes/:key', async (req, res) => {
  // GET /api/reference/classes/:key
});

// Get subclasses for a class
router.get('/classes/:key/subclasses', async (req, res) => {
  // GET /api/reference/classes/:key/subclasses
});

// Get all races
router.get('/races', async (req, res) => {
  // GET /api/reference/races
});

// Get all spells
router.get('/spells', async (req, res) => {
  // GET /api/reference/spells
  // Query params: ?level=1&school=evocation&class=wizard
});

// Get all feats
router.get('/feats', async (req, res) => {
  // GET /api/reference/feats
});

// Get all backgrounds
router.get('/backgrounds', async (req, res) => {
  // GET /api/reference/backgrounds
});

// Get all magic items
router.get('/magic-items', async (req, res) => {
  // GET /api/reference/magic-items
  // Query params: ?type=weapon&rarity=rare
});

// Get all weapons
router.get('/weapons', async (req, res) => {
  // GET /api/reference/weapons
});

// Get all armor
router.get('/armor', async (req, res) => {
  // GET /api/reference/armor
});

export default router;
```

---

## 5. Frontend Components

### 5.1 Component Hierarchy

```
App
├── AuthProvider
├── Router
    ├── LoginPage
    ├── RegisterPage
    ├── DashboardPage
    │   └── CharacterSheetList
    └── CharacterSheetPage
        ├── CharacterHeader
        ├── AbilityScoresPanel
        ├── SkillsPanel
        ├── CombatStatsPanel
        ├── FeaturesPanel
        ├── EquipmentPanel
        ├── SpellsPanel
        └── NotesPanel
```

### 5.2 Example Component: Ability Scores Panel

```typescript
// components/AbilityScoresPanel.tsx

import React from 'react';
import { useCharacterSheet } from '../hooks/useCharacterSheet';

interface AbilityScore {
  score: number;
  modifier: number;
}

export const AbilityScoresPanel: React.FC = () => {
  const { characterSheet, updateAbilityScores } = useCharacterSheet();
  
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const abilityNames = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma'
  };
  
  // Calculate current scores from backend data
  const abilityScores: Record<string, AbilityScore> = 
    characterSheet?.calculatedAbilityScores || {};
  
  return (
    <div className="ability-scores-panel">
      <h2>Ability Scores</h2>
      <div className="abilities-grid">
        {abilities.map(ability => (
          <div key={ability} className="ability-card">
            <h3>{abilityNames[ability]}</h3>
            <div className="ability-score">
              {abilityScores[ability]?.score || 10}
            </div>
            <div className="ability-modifier">
              {formatModifier(abilityScores[ability]?.modifier || 0)}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => openAbilityScoreDialog()}>
        Edit Ability Scores
      </button>
    </div>
  );
};

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
```

---

## 6. Calculation Logic

All calculations MUST be performed on the backend. The frontend only displays the results.

### 6.1 Calculation Flow

```
User Action (Frontend)
    ↓
API Request to Backend
    ↓
Backend Service Updates Data
    ↓
Backend Triggers Recalculation
    ↓
All Derived Values Computed
    ↓
Updated Data Saved to Database
    ↓
Response Sent to Frontend
    ↓
Frontend Updates Display
```

### 6.2 Calculation Dependencies

```
Level → Proficiency Bonus
Ability Scores → Ability Modifiers
Ability Modifiers + Proficiency → Saving Throws
Ability Modifiers + Proficiency + Expertise → Skills
Ability Modifiers + Armor → AC
Dexterity Modifier → Initiative
Classes + Level → Spell Slots
Spellcasting Ability + Proficiency → Spell Save DC
Spellcasting Ability + Proficiency → Spell Attack Bonus
```

---

## 7. External Data Integration

### 7.1 Google Sheets Sync Service

```typescript
// services/googleSheetsSyncService.ts

import { google } from 'googleapis';

export class GoogleSheetsSyncService {
  private sheets = google.sheets('v4');
  private spreadsheetId = '15xq5gP3MujE7nc7POGngFWKLhabkun9BoUW7vvrhkTY';
  
  async syncAllData(): Promise<void> {
    await this.syncClasses();
    await this.syncRaces();
    await this.syncSpells();
    await this.syncFeats();
    await this.syncBackgrounds();
    await this.syncMagicItems();
    await this.syncWeapons();
    await this.syncArmor();
  }
  
  private async syncClasses(): Promise<void> {
    const range = 'Classes!A2:Z1000';
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range
    });
    
    const rows = response.data.values;
    if (!rows) return;
    
    for (const row of rows) {
      const classData = this.parseClassRow(row);
      await this.upsertClass(classData);
    }
  }
  
  private parseClassRow(row: any[]): any {
    return {
      key: row[0],
      name: row[1],
      source: row[2],
      hitDie: parseInt(row[3]),
      primaryAbility: row[4],
      // ... parse other fields
    };
  }
  
  private async upsertClass(classData: any): Promise<void> {
    // Upsert to database using Prisma
  }
}
```

---

## 8. Implementation Phases

### Phase 1: MVP (4-6 weeks)
- User authentication
- Basic character sheet CRUD
- Ability scores with manual entry
- Simple class selection
- Basic calculations (proficiency, modifiers)
- Responsive UI for character sheet

### Phase 2: Core Features (6-8 weeks)
- Complete class system with subclasses
- Race selection with variants
- Background selection
- Feat system
- Equipment management
- Spell system
- Attack calculations

### Phase 3: Advanced Features (4-6 weeks)
- Google Sheets integration
- Custom script support
- Source material filtering
- Import/export functionality
- Companion management
- Advanced layout options

### Phase 4: Polish (2-4 weeks)
- Performance optimization
- UI/UX improvements
- Mobile responsiveness
- Testing and bug fixes
- Documentation

---

## Summary

This implementation guide provides:

✅ Complete database schema with Prisma
✅ Backend services for all calculations
✅ API endpoint definitions
✅ Frontend component structure
✅ Calculation logic with formulas
✅ External data integration strategy
✅ Phased implementation plan

All business logic resides in the backend, with the frontend serving only as a presentation layer.