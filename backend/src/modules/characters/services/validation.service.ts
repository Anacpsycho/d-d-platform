import { Injectable, BadRequestException } from '@nestjs/common';
import { CurrentStats, CharacterClass, Skills, SavingThrows } from '../schemas/character-sheet.schema';

@Injectable()
export class ValidationService {
  /**
   * Validate ability scores structure
   */
  validateAbilityScores(stats: CurrentStats): void {
    if (!stats || !stats.cols || !Array.isArray(stats.cols)) {
      throw new BadRequestException('Invalid ability scores structure');
    }

    const validTypes = ['base', 'race', 'feats', 'classes', 'levels', 'magic', 'items', 'override', 'maximum'];
    
    for (const col of stats.cols) {
      if (!validTypes.includes(col.type)) {
        throw new BadRequestException(`Invalid ability score type: ${col.type}`);
      }

      if (!Array.isArray(col.scores) || col.scores.length !== 7) {
        throw new BadRequestException('Ability scores must be an array of 7 numbers');
      }

      for (const score of col.scores) {
        if (typeof score !== 'number' || score < 0 || score > 30) {
          throw new BadRequestException('Ability scores must be between 0 and 30');
        }
      }
    }
  }

  /**
   * Validate character level
   */
  validateLevel(level: number): void {
    if (level < 1 || level > 20) {
      throw new BadRequestException('Character level must be between 1 and 20');
    }
  }

  /**
   * Validate classes array
   */
  validateClasses(classes: CharacterClass[]): void {
    if (!Array.isArray(classes)) {
      throw new BadRequestException('Classes must be an array');
    }

    let totalLevel = 0;
    for (const charClass of classes) {
      if (!charClass.classKey || !charClass.name) {
        throw new BadRequestException('Each class must have a classKey and name');
      }

      if (charClass.level < 1 || charClass.level > 20) {
        throw new BadRequestException('Class level must be between 1 and 20');
      }

      totalLevel += charClass.level;
    }

    if (totalLevel > 20) {
      throw new BadRequestException('Total character level cannot exceed 20');
    }
  }

  /**
   * Validate hit points
   */
  validateHitPoints(current: number, max: number, temp: number = 0): void {
    if (current < 0) {
      throw new BadRequestException('Current hit points cannot be negative');
    }

    if (max < 1) {
      throw new BadRequestException('Maximum hit points must be at least 1');
    }

    if (current > max) {
      throw new BadRequestException('Current hit points cannot exceed maximum');
    }

    if (temp < 0) {
      throw new BadRequestException('Temporary hit points cannot be negative');
    }
  }

  /**
   * Validate armor class
   */
  validateArmorClass(ac: number): void {
    if (ac < 1 || ac > 30) {
      throw new BadRequestException('Armor class must be between 1 and 30');
    }
  }

  /**
   * Validate speed
   */
  validateSpeed(speed: number): void {
    if (speed < 0 || speed > 120) {
      throw new BadRequestException('Speed must be between 0 and 120');
    }
  }

  /**
   * Validate skills structure
   */
  validateSkills(skills: Skills): void {
    const requiredSkills = [
      'acrobatics',
      'animalHandling',
      'arcana',
      'athletics',
      'deception',
      'history',
      'insight',
      'intimidation',
      'investigation',
      'medicine',
      'nature',
      'perception',
      'performance',
      'persuasion',
      'religion',
      'sleightOfHand',
      'stealth',
      'survival',
    ];

    for (const skillName of requiredSkills) {
      const skill = skills[skillName as keyof Skills];
      if (!skill) {
        throw new BadRequestException(`Missing skill: ${skillName}`);
      }

      if (typeof skill.proficient !== 'boolean') {
        throw new BadRequestException(`Invalid proficient value for skill: ${skillName}`);
      }

      if (typeof skill.expertise !== 'boolean') {
        throw new BadRequestException(`Invalid expertise value for skill: ${skillName}`);
      }

      if (skill.expertise && !skill.proficient) {
        throw new BadRequestException(`Cannot have expertise without proficiency in skill: ${skillName}`);
      }
    }
  }

  /**
   * Validate saving throws structure
   */
  validateSavingThrows(saves: SavingThrows): void {
    const requiredSaves = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

    for (const saveName of requiredSaves) {
      const save = saves[saveName as keyof SavingThrows];
      if (!save) {
        throw new BadRequestException(`Missing saving throw: ${saveName}`);
      }

      if (typeof save.proficient !== 'boolean') {
        throw new BadRequestException(`Invalid proficient value for saving throw: ${saveName}`);
      }
    }
  }

  /**
   * Validate spell slots
   */
  validateSpellSlots(slots: Record<number, { max: number; used: number }>): void {
    for (const [level, slot] of Object.entries(slots)) {
      const spellLevel = parseInt(level);
      
      if (spellLevel < 1 || spellLevel > 9) {
        throw new BadRequestException('Spell level must be between 1 and 9');
      }

      if (slot.max < 0) {
        throw new BadRequestException(`Maximum spell slots cannot be negative for level ${spellLevel}`);
      }

      if (slot.used < 0) {
        throw new BadRequestException(`Used spell slots cannot be negative for level ${spellLevel}`);
      }

      if (slot.used > slot.max) {
        throw new BadRequestException(`Used spell slots cannot exceed maximum for level ${spellLevel}`);
      }
    }
  }

  /**
   * Validate spellcasting ability
   */
  validateSpellcastingAbility(ability?: string): void {
    if (!ability) return;

    const validAbilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    if (!validAbilities.includes(ability.toLowerCase())) {
      throw new BadRequestException('Invalid spellcasting ability');
    }
  }

  /**
   * Validate experience points
   */
  validateExperiencePoints(xp: number, level: number): void {
    if (xp < 0) {
      throw new BadRequestException('Experience points cannot be negative');
    }

    // XP thresholds for each level
    const xpThresholds = [
      0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
      85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
    ];

    const minXP = xpThresholds[level - 1] || 0;
    const maxXP = level < 20 ? xpThresholds[level] - 1 : Infinity;

    if (xp < minXP) {
      throw new BadRequestException(`Experience points too low for level ${level}`);
    }

    if (xp > maxXP && level < 20) {
      throw new BadRequestException(`Experience points too high for level ${level}. Consider leveling up.`);
    }
  }

  /**
   * Validate point buy (standard 27 points)
   */
  validatePointBuy(stats: CurrentStats, maxPoints: number = 27): void {
    const costs: Record<number, number> = {
      8: 0,
      9: 1,
      10: 2,
      11: 3,
      12: 4,
      13: 5,
      14: 7,
      15: 9,
    };

    let total = 0;
    const baseCol = stats.cols.find((c) => c.type === 'base');

    if (!baseCol) {
      throw new BadRequestException('Base ability scores not found');
    }

    for (let i = 0; i < 6; i++) {
      const score = baseCol.scores[i];
      
      if (score < 8 || score > 15) {
        throw new BadRequestException('Base ability scores must be between 8 and 15 for point buy');
      }

      if (!(score in costs)) {
        throw new BadRequestException(`Invalid base ability score: ${score}`);
      }

      total += costs[score];
    }

    if (total > maxPoints) {
      throw new BadRequestException(`Point buy total (${total}) exceeds maximum (${maxPoints})`);
    }
  }

  /**
   * Validate currency
   */
  validateCurrency(currency: { cp: number; sp: number; ep: number; gp: number; pp: number }): void {
    const coins = ['cp', 'sp', 'ep', 'gp', 'pp'];
    
    for (const coin of coins) {
      const value = currency[coin as keyof typeof currency];
      if (typeof value !== 'number' || value < 0) {
        throw new BadRequestException(`Invalid ${coin} value`);
      }
    }
  }

  /**
   * Validate alignment
   */
  validateAlignment(alignment?: string): void {
    if (!alignment) return;

    const validAlignments = [
      'Lawful Good',
      'Neutral Good',
      'Chaotic Good',
      'Lawful Neutral',
      'True Neutral',
      'Chaotic Neutral',
      'Lawful Evil',
      'Neutral Evil',
      'Chaotic Evil',
      'Unaligned',
    ];

    if (!validAlignments.includes(alignment)) {
      throw new BadRequestException('Invalid alignment');
    }
  }

  /**
   * Validate source configuration
   */
  validateSourceConfig(config: { allowedSources: string[]; excludedResources?: any }): void {
    if (!config.allowedSources || !Array.isArray(config.allowedSources)) {
      throw new BadRequestException('Source configuration must include allowedSources array');
    }

    if (config.allowedSources.length === 0) {
      throw new BadRequestException('At least one source must be allowed');
    }
  }
}

// Made with Bob
