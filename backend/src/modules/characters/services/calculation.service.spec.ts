import { Test, TestingModule } from '@nestjs/testing';
import { CalculationService } from './calculation.service';
import { CurrentStats, CharacterClass } from '../schemas/character-sheet.schema';

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculationService],
    }).compile();

    service = module.get<CalculationService>(CalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateModifier', () => {
    it('should calculate ability modifier correctly', () => {
      expect(service.calculateModifier(10)).toBe(0);
      expect(service.calculateModifier(8)).toBe(-1);
      expect(service.calculateModifier(15)).toBe(2);
      expect(service.calculateModifier(20)).toBe(5);
      expect(service.calculateModifier(1)).toBe(-5);
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('should calculate proficiency bonus by level', () => {
      expect(service.calculateProficiencyBonus(1)).toBe(2);
      expect(service.calculateProficiencyBonus(4)).toBe(2);
      expect(service.calculateProficiencyBonus(5)).toBe(3);
      expect(service.calculateProficiencyBonus(8)).toBe(3);
      expect(service.calculateProficiencyBonus(9)).toBe(4);
      expect(service.calculateProficiencyBonus(12)).toBe(4);
      expect(service.calculateProficiencyBonus(13)).toBe(5);
      expect(service.calculateProficiencyBonus(16)).toBe(5);
      expect(service.calculateProficiencyBonus(17)).toBe(6);
      expect(service.calculateProficiencyBonus(20)).toBe(6);
    });
  });

  describe('calculateAbilityScore', () => {
    it('should sum all components except override and maximum', () => {
      const stats: CurrentStats = {
        cols: [
          { type: 'base', scores: [15, 14, 13, 12, 10, 8, 0] },
          { type: 'race', scores: [2, 0, 1, 0, 0, 0, 0] },
          { type: 'override', scores: [0, 0, 0, 0, 0, 0, 0] },
          { type: 'maximum', scores: [20, 20, 20, 20, 20, 20, 20] },
        ],
      };

      expect(service.calculateAbilityScore(stats, 0)).toBe(17); // STR: 15 + 2
      expect(service.calculateAbilityScore(stats, 1)).toBe(14); // DEX: 14
      expect(service.calculateAbilityScore(stats, 2)).toBe(14); // CON: 13 + 1
    });

    it('should use override when set', () => {
      const stats: CurrentStats = {
        cols: [
          { type: 'base', scores: [15, 14, 13, 12, 10, 8, 0] },
          { type: 'override', scores: [18, 0, 0, 0, 0, 0, 0] },
          { type: 'maximum', scores: [20, 20, 20, 20, 20, 20, 20] },
        ],
      };

      expect(service.calculateAbilityScore(stats, 0)).toBe(18);
    });

    it('should cap at maximum', () => {
      const stats: CurrentStats = {
        cols: [
          { type: 'base', scores: [18, 14, 13, 12, 10, 8, 0] },
          { type: 'race', scores: [2, 0, 0, 0, 0, 0, 0] },
          { type: 'items', scores: [2, 0, 0, 0, 0, 0, 0] },
          { type: 'maximum', scores: [20, 20, 20, 20, 20, 20, 20] },
        ],
      };

      expect(service.calculateAbilityScore(stats, 0)).toBe(20); // 18 + 2 + 2 = 22, capped at 20
    });
  });

  describe('calculateSkillModifier', () => {
    it('should calculate skill modifier without proficiency', () => {
      expect(service.calculateSkillModifier(3, false, false, 2)).toBe(3);
    });

    it('should add proficiency bonus when proficient', () => {
      expect(service.calculateSkillModifier(3, true, false, 2)).toBe(5);
    });

    it('should double proficiency bonus with expertise', () => {
      expect(service.calculateSkillModifier(3, true, true, 2)).toBe(7);
    });

    it('should include additional bonus', () => {
      expect(service.calculateSkillModifier(3, true, false, 2, 1)).toBe(6);
    });
  });

  describe('calculateSavingThrowModifier', () => {
    it('should calculate saving throw without proficiency', () => {
      expect(service.calculateSavingThrowModifier(2, false, 3)).toBe(2);
    });

    it('should add proficiency bonus when proficient', () => {
      expect(service.calculateSavingThrowModifier(2, true, 3)).toBe(5);
    });

    it('should include additional bonus', () => {
      expect(service.calculateSavingThrowModifier(2, true, 3, 1)).toBe(6);
    });
  });

  describe('calculateArmorClass', () => {
    it('should calculate unarmored AC', () => {
      expect(service.calculateArmorClass(3, 'none')).toBe(13); // 10 + 3
    });

    it('should calculate light armor AC', () => {
      expect(service.calculateArmorClass(3, 'light', 11)).toBe(14); // 11 + 3
    });

    it('should calculate medium armor AC with dex cap', () => {
      expect(service.calculateArmorClass(3, 'medium', 14)).toBe(16); // 14 + min(3, 2)
      expect(service.calculateArmorClass(1, 'medium', 14)).toBe(15); // 14 + 1
    });

    it('should calculate heavy armor AC without dex', () => {
      expect(service.calculateArmorClass(3, 'heavy', 18)).toBe(18);
    });

    it('should add shield bonus', () => {
      expect(service.calculateArmorClass(3, 'none', 10, true)).toBe(15); // 10 + 3 + 2
    });

    it('should include additional bonus', () => {
      expect(service.calculateArmorClass(3, 'none', 10, false, 1)).toBe(14);
    });
  });

  describe('calculateInitiative', () => {
    it('should calculate initiative from dex modifier', () => {
      expect(service.calculateInitiative(3)).toBe(3);
      expect(service.calculateInitiative(-1)).toBe(-1);
    });

    it('should include additional bonus', () => {
      expect(service.calculateInitiative(3, 2)).toBe(5);
    });
  });

  describe('calculateSpellSaveDC', () => {
    it('should calculate spell save DC', () => {
      expect(service.calculateSpellSaveDC(4, 3)).toBe(15); // 8 + 4 + 3
    });

    it('should include additional bonus', () => {
      expect(service.calculateSpellSaveDC(4, 3, 1)).toBe(16);
    });
  });

  describe('calculateSpellAttackBonus', () => {
    it('should calculate spell attack bonus', () => {
      expect(service.calculateSpellAttackBonus(4, 3)).toBe(7); // 4 + 3
    });

    it('should include additional bonus', () => {
      expect(service.calculateSpellAttackBonus(4, 3, 1)).toBe(8);
    });
  });

  describe('calculateSpellSlots', () => {
    it('should calculate spell slots for full caster', () => {
      const classes: CharacterClass[] = [
        { classKey: 'wizard', level: 5, name: 'Wizard', spellcastingFactor: 1 },
      ];

      const slots = service.calculateSpellSlots(classes);

      expect(slots[1]).toEqual({ max: 4, used: 0 });
      expect(slots[2]).toEqual({ max: 3, used: 0 });
      expect(slots[3]).toEqual({ max: 2, used: 0 });
      expect(slots[4]).toBeUndefined();
    });

    it('should calculate spell slots for half caster', () => {
      const classes: CharacterClass[] = [
        { classKey: 'paladin', level: 6, name: 'Paladin', spellcastingFactor: 2 },
      ];

      const slots = service.calculateSpellSlots(classes);

      expect(slots[1]).toEqual({ max: 4, used: 0 });
      expect(slots[2]).toBeUndefined();
    });

    it('should calculate spell slots for multiclass', () => {
      const classes: CharacterClass[] = [
        { classKey: 'wizard', level: 3, name: 'Wizard', spellcastingFactor: 1 },
        { classKey: 'cleric', level: 2, name: 'Cleric', spellcastingFactor: 1 },
      ];

      const slots = service.calculateSpellSlots(classes);

      expect(slots[1]).toEqual({ max: 4, used: 0 });
      expect(slots[2]).toEqual({ max: 3, used: 0 });
      expect(slots[3]).toEqual({ max: 2, used: 0 });
    });

    it('should cap at level 20', () => {
      const classes: CharacterClass[] = [
        { classKey: 'wizard', level: 20, name: 'Wizard', spellcastingFactor: 1 },
        { classKey: 'cleric', level: 5, name: 'Cleric', spellcastingFactor: 1 },
      ];

      const slots = service.calculateSpellSlots(classes);

      // Should use level 20 slots, not level 25
      expect(slots[9]).toEqual({ max: 1, used: 0 });
    });
  });

  describe('calculateHPGainOnLevelUp', () => {
    it('should calculate average HP gain', () => {
      expect(service.calculateHPGainOnLevelUp(8, 2, true)).toBe(7); // floor(8/2) + 1 + 2
      expect(service.calculateHPGainOnLevelUp(10, 3, true)).toBe(9); // floor(10/2) + 1 + 3
    });

    it('should have minimum of 1 HP', () => {
      expect(service.calculateHPGainOnLevelUp(6, -5, true)).toBe(1);
    });
  });

  describe('calculateCarryingCapacity', () => {
    it('should calculate carrying capacity', () => {
      expect(service.calculateCarryingCapacity(10)).toBe(150);
      expect(service.calculateCarryingCapacity(15)).toBe(225);
      expect(service.calculateCarryingCapacity(20)).toBe(300);
    });
  });

  describe('calculatePointBuy', () => {
    it('should calculate point buy total', () => {
      const stats: CurrentStats = {
        cols: [
          { type: 'base', scores: [15, 14, 13, 12, 10, 8, 0] },
        ],
      };

      const total = service.calculatePointBuy(stats);
      expect(total).toBe(27); // 9 + 7 + 5 + 4 + 2 + 0
    });

    it('should return 0 for all 8s', () => {
      const stats: CurrentStats = {
        cols: [
          { type: 'base', scores: [8, 8, 8, 8, 8, 8, 0] },
        ],
      };

      expect(service.calculatePointBuy(stats)).toBe(0);
    });
  });

  describe('calculateTotalLevel', () => {
    it('should sum all class levels', () => {
      const classes: CharacterClass[] = [
        { classKey: 'fighter', level: 5, name: 'Fighter' },
        { classKey: 'wizard', level: 3, name: 'Wizard' },
      ];

      expect(service.calculateTotalLevel(classes)).toBe(8);
    });

    it('should return 0 for empty array', () => {
      expect(service.calculateTotalLevel([])).toBe(0);
    });
  });
});

// Made with Bob
