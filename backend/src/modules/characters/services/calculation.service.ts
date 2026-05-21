import { Injectable } from '@nestjs/common';
import { 
  CurrentStats, 
  CharacterClass, 
  SavingThrows, 
  Skills, 
  Skill,
  SavingThrow,
  SpellSlots 
} from '../schemas/character-sheet.schema';

@Injectable()
export class CalculationService {
  /**
   * Calculate ability modifier from score
   * Formula: Math.floor((abilityScore - 10) / 2)
   */
  calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Calculate proficiency bonus based on character level
   * Formula: Math.ceil(totalLevel / 4) + 1
   * Level 1-4: +2, Level 5-8: +3, Level 9-12: +4, Level 13-16: +5, Level 17-20: +6
   */
  calculateProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  }

  /**
   * Calculate final ability score from all components
   */
  calculateAbilityScore(stats: CurrentStats, abilityIndex: number): number {
    const override = this.getScoreByType(stats, 'override', abilityIndex);
    const maximum = this.getScoreByType(stats, 'maximum', abilityIndex);
    
    // If override is set, use it (capped by maximum)
    if (override > 0) {
      return Math.min(override, maximum || 30);
    }
    
    // Otherwise, sum all components except override and maximum
    let total = 0;
    for (const col of stats.cols) {
      if (col.type !== 'override' && col.type !== 'maximum') {
        total += col.scores[abilityIndex];
      }
    }
    
    // Cap at maximum (default 30 if not set)
    return Math.min(total, maximum || 30);
  }

  /**
   * Get all ability scores and modifiers
   */
  getAllAbilityScores(stats: CurrentStats): Record<string, { score: number; modifier: number }> {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'hos'];
    const result: Record<string, { score: number; modifier: number }> = {};
    
    abilities.forEach((ability, index) => {
      const score = this.calculateAbilityScore(stats, index);
      result[ability] = {
        score,
        modifier: this.calculateModifier(score),
      };
    });
    
    return result;
  }

  /**
   * Calculate skill modifier
   * Formula: abilityModifier + (proficient ? proficiencyBonus : 0) + (expertise ? proficiencyBonus : 0)
   */
  calculateSkillModifier(
    abilityModifier: number,
    proficient: boolean,
    expertise: boolean,
    proficiencyBonus: number,
    additionalBonus: number = 0,
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
   * Calculate all skill modifiers
   */
  calculateAllSkills(
    abilityScores: Record<string, { score: number; modifier: number }>,
    skills: Skills,
    proficiencyBonus: number,
  ): Skills {
    const skillAbilityMap = {
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
      survival: 'wis',
    };

    const calculatedSkills: Skills = {} as Skills;

    for (const [skillName, abilityKey] of Object.entries(skillAbilityMap)) {
      const skill = skills[skillName as keyof Skills] || { proficient: false, expertise: false, bonus: 0 };
      const abilityModifier = abilityScores[abilityKey]?.modifier || 0;
      
      calculatedSkills[skillName as keyof Skills] = {
        proficient: skill.proficient,
        expertise: skill.expertise,
        bonus: this.calculateSkillModifier(
          abilityModifier,
          skill.proficient,
          skill.expertise,
          proficiencyBonus,
          skill.bonus,
        ),
      };
    }

    return calculatedSkills;
  }

  /**
   * Calculate saving throw modifier
   * Formula: abilityModifier + (proficient ? proficiencyBonus : 0)
   */
  calculateSavingThrowModifier(
    abilityModifier: number,
    proficient: boolean,
    proficiencyBonus: number,
    additionalBonus: number = 0,
  ): number {
    let modifier = abilityModifier + additionalBonus;
    
    if (proficient) {
      modifier += proficiencyBonus;
    }
    
    return modifier;
  }

  /**
   * Calculate all saving throws
   */
  calculateAllSavingThrows(
    abilityScores: Record<string, { score: number; modifier: number }>,
    savingThrows: SavingThrows,
    proficiencyBonus: number,
  ): SavingThrows {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const calculatedSaves: SavingThrows = {} as SavingThrows;

    for (const ability of abilities) {
      const save = savingThrows[ability as keyof SavingThrows] || { proficient: false, bonus: 0 };
      const abilityModifier = abilityScores[ability]?.modifier || 0;
      
      calculatedSaves[ability as keyof SavingThrows] = {
        proficient: save.proficient,
        bonus: this.calculateSavingThrowModifier(
          abilityModifier,
          save.proficient,
          proficiencyBonus,
          save.bonus,
        ),
      };
    }

    return calculatedSaves;
  }

  /**
   * Calculate Armor Class
   * Formulas:
   * - Unarmored: 10 + dexterityModifier
   * - Light Armor: armorBase + dexterityModifier
   * - Medium Armor: armorBase + Math.min(dexterityModifier, 2)
   * - Heavy Armor: armorBase
   * - Shield: +2 if equipped
   */
  calculateArmorClass(
    dexterityModifier: number,
    armorType: 'none' | 'light' | 'medium' | 'heavy',
    armorBase: number = 10,
    hasShield: boolean = false,
    additionalBonus: number = 0,
  ): number {
    let ac = 0;

    switch (armorType) {
      case 'none':
        ac = 10 + dexterityModifier;
        break;
      case 'light':
        ac = armorBase + dexterityModifier;
        break;
      case 'medium':
        ac = armorBase + Math.min(dexterityModifier, 2);
        break;
      case 'heavy':
        ac = armorBase;
        break;
    }

    if (hasShield) {
      ac += 2;
    }

    return ac + additionalBonus;
  }

  /**
   * Calculate Initiative
   * Formula: dexterityModifier + bonuses
   */
  calculateInitiative(dexterityModifier: number, additionalBonus: number = 0): number {
    return dexterityModifier + additionalBonus;
  }

  /**
   * Calculate Spell Save DC
   * Formula: 8 + proficiencyBonus + spellcastingAbilityModifier
   */
  calculateSpellSaveDC(
    spellcastingAbilityModifier: number,
    proficiencyBonus: number,
    additionalBonus: number = 0,
  ): number {
    return 8 + spellcastingAbilityModifier + proficiencyBonus + additionalBonus;
  }

  /**
   * Calculate Spell Attack Bonus
   * Formula: proficiencyBonus + spellcastingAbilityModifier
   */
  calculateSpellAttackBonus(
    spellcastingAbilityModifier: number,
    proficiencyBonus: number,
    additionalBonus: number = 0,
  ): number {
    return spellcastingAbilityModifier + proficiencyBonus + additionalBonus;
  }

  /**
   * Calculate spell slots for multiclass characters
   */
  calculateSpellSlots(classes: CharacterClass[]): SpellSlots {
    // Spell slots per level for full casters
    const FULL_CASTER_SLOTS = [
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

    // Calculate effective caster level
    let effectiveLevel = 0;
    
    for (const charClass of classes) {
      const factor = charClass.spellcastingFactor || 0;
      
      if (factor === 1) {
        // Full caster (Wizard, Cleric, etc.)
        effectiveLevel += charClass.level;
      } else if (factor === 2) {
        // Half caster (Paladin, Ranger)
        effectiveLevel += Math.floor(charClass.level / 2);
      } else if (factor === 3) {
        // Third caster (Eldritch Knight, Arcane Trickster)
        effectiveLevel += Math.floor(charClass.level / 3);
      }
    }
    
    // Cap at level 20
    effectiveLevel = Math.min(effectiveLevel, 20);
    
    // Get spell slots for effective level
    const slots = FULL_CASTER_SLOTS[effectiveLevel];
    
    // Convert to object
    const result: SpellSlots = {};
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] > 0) {
        result[i + 1] = {
          max: slots[i],
          used: 0,
        };
      }
    }
    
    return result;
  }

  /**
   * Calculate HP gain on level up
   * Formula (average): Math.floor(hitDice / 2) + 1 + constitutionModifier
   * Minimum: 1
   */
  calculateHPGainOnLevelUp(
    hitDice: number,
    constitutionModifier: number,
    useAverage: boolean = true,
  ): number {
    let hpGain: number;
    
    if (useAverage) {
      hpGain = Math.floor(hitDice / 2) + 1 + constitutionModifier;
    } else {
      // For rolled HP, this would need to be passed in
      // For now, we'll use average as default
      hpGain = Math.floor(hitDice / 2) + 1 + constitutionModifier;
    }
    
    // Minimum 1 HP per level
    return Math.max(1, hpGain);
  }

  /**
   * Calculate carrying capacity
   * Formula: strengthScore * 15 (pounds)
   */
  calculateCarryingCapacity(strengthScore: number): number {
    return strengthScore * 15;
  }

  /**
   * Calculate point buy value for ability scores
   */
  calculatePointBuy(stats: CurrentStats): number {
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
    
    if (baseCol) {
      for (let i = 0; i < 6; i++) {
        // First 6 abilities (not HoS)
        const score = baseCol.scores[i];
        total += costs[score] || 0;
      }
    }
    
    return total;
  }

  /**
   * Calculate total character level from all classes
   */
  calculateTotalLevel(classes: CharacterClass[]): number {
    return classes.reduce((total, charClass) => total + charClass.level, 0);
  }

  /**
   * Helper method to get score by type
   */
  private getScoreByType(stats: CurrentStats, type: string, index: number): number {
    const col = stats.cols.find((c) => c.type === type);
    return col ? col.scores[index] : 0;
  }
}

// Made with Bob
