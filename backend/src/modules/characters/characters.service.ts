import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CharacterSheet, CharacterSheetDocument, Skills, SavingThrows, Skill, SavingThrow } from './schemas/character-sheet.schema';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CalculationService } from './services/calculation.service';
import { ValidationService } from './services/validation.service';

@Injectable()
export class CharactersService {
  constructor(
    @InjectModel(CharacterSheet.name)
    private characterModel: Model<CharacterSheetDocument>,
    private calculationService: CalculationService,
    private validationService: ValidationService,
  ) {}

  /**
   * Create a new character sheet
   */
  async create(userId: string, createCharacterDto: CreateCharacterDto): Promise<CharacterSheet> {
    // Validate input
    this.validationService.validateAbilityScores(createCharacterDto.abilityScores);
    this.validationService.validateSourceConfig(createCharacterDto.sourcesConfig);
    
    if (createCharacterDto.level) {
      this.validationService.validateLevel(createCharacterDto.level);
    }
    
    if (createCharacterDto.classes) {
      this.validationService.validateClasses(createCharacterDto.classes);
    }

    if (createCharacterDto.spellcastingAbility) {
      this.validationService.validateSpellcastingAbility(createCharacterDto.spellcastingAbility);
    }

    if (createCharacterDto.alignment) {
      this.validationService.validateAlignment(createCharacterDto.alignment);
    }

    // Calculate initial values
    const level = createCharacterDto.level || 1;
    const classes = createCharacterDto.classes || [];
    const proficiencyBonus = this.calculationService.calculateProficiencyBonus(level);
    const abilityScores = this.calculationService.getAllAbilityScores(createCharacterDto.abilityScores);

    // Initialize skills with default values
    const defaultSkills: Skills = this.initializeSkills();
    const calculatedSkills = this.calculationService.calculateAllSkills(
      abilityScores,
      defaultSkills,
      proficiencyBonus,
    );

    // Initialize saving throws with default values
    const defaultSaves: SavingThrows = this.initializeSavingThrows();
    const calculatedSaves = this.calculationService.calculateAllSavingThrows(
      abilityScores,
      defaultSaves,
      proficiencyBonus,
    );

    // Calculate combat stats
    const initiative = this.calculationService.calculateInitiative(abilityScores.dex.modifier);
    const armorClass = this.calculationService.calculateArmorClass(abilityScores.dex.modifier, 'none');

    // Calculate spell slots if character has spellcasting classes
    let spellSlots = undefined;
    let spellSaveDC = undefined;
    let spellAttackBonus = undefined;

    if (createCharacterDto.spellcastingAbility && classes.length > 0) {
      const spellcastingClasses = classes.filter((c) => c.spellcastingFactor);
      if (spellcastingClasses.length > 0) {
        spellSlots = this.calculationService.calculateSpellSlots(spellcastingClasses);
        const spellAbilityMod = abilityScores[createCharacterDto.spellcastingAbility]?.modifier || 0;
        spellSaveDC = this.calculationService.calculateSpellSaveDC(spellAbilityMod, proficiencyBonus);
        spellAttackBonus = this.calculationService.calculateSpellAttackBonus(spellAbilityMod, proficiencyBonus);
      }
    }

    // Create character
    const character = new this.characterModel({
      userId: new Types.ObjectId(userId),
      ...createCharacterDto,
      level,
      proficiencyBonus,
      currentHitPoints: createCharacterDto.maxHitPoints || 0,
      temporaryHitPoints: 0,
      armorClass,
      initiative,
      skills: calculatedSkills,
      savingThrows: calculatedSaves,
      spellSlots,
      spellSaveDC,
      spellAttackBonus,
      equipment: [],
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      features: [],
      feats: [],
      attacks: [],
      spellsKnown: createCharacterDto.spellsKnown || [],
      spellsPrepared: [],
    });

    return character.save();
  }

  /**
   * Find all characters for a user
   */
  async findAll(userId: string): Promise<CharacterSheet[]> {
    return this.characterModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  /**
   * Find one character by ID
   */
  async findOne(id: string, userId: string): Promise<CharacterSheetDocument> {
    const character = await this.characterModel.findById(id).exec();
    
    if (!character) {
      throw new NotFoundException('Character not found');
    }

    // Check ownership
    if (character.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this character');
    }

    return character;
  }

  /**
   * Update a character
   */
  async update(id: string, userId: string, updateCharacterDto: UpdateCharacterDto): Promise<CharacterSheetDocument> {
    const character = await this.findOne(id, userId);

    // Validate updates
    if (updateCharacterDto.abilityScores) {
      this.validationService.validateAbilityScores(updateCharacterDto.abilityScores);
    }

    if (updateCharacterDto.level) {
      this.validationService.validateLevel(updateCharacterDto.level);
    }

    if (updateCharacterDto.classes) {
      this.validationService.validateClasses(updateCharacterDto.classes);
    }

    if (updateCharacterDto.currentHitPoints !== undefined || updateCharacterDto.maxHitPoints !== undefined) {
      const currentHP = updateCharacterDto.currentHitPoints ?? character.currentHitPoints;
      const maxHP = updateCharacterDto.maxHitPoints ?? character.maxHitPoints;
      const tempHP = updateCharacterDto.temporaryHitPoints ?? character.temporaryHitPoints;
      this.validationService.validateHitPoints(currentHP, maxHP, tempHP);
    }

    if (updateCharacterDto.armorClass) {
      this.validationService.validateArmorClass(updateCharacterDto.armorClass);
    }

    if (updateCharacterDto.speed) {
      this.validationService.validateSpeed(updateCharacterDto.speed);
    }

    if (updateCharacterDto.skills) {
      this.validationService.validateSkills(updateCharacterDto.skills);
    }

    if (updateCharacterDto.savingThrows) {
      this.validationService.validateSavingThrows(updateCharacterDto.savingThrows);
    }

    if (updateCharacterDto.spellSlots) {
      this.validationService.validateSpellSlots(updateCharacterDto.spellSlots);
    }

    if (updateCharacterDto.spellcastingAbility) {
      this.validationService.validateSpellcastingAbility(updateCharacterDto.spellcastingAbility);
    }

    if (updateCharacterDto.currency) {
      this.validationService.validateCurrency(updateCharacterDto.currency);
    }

    if (updateCharacterDto.alignment) {
      this.validationService.validateAlignment(updateCharacterDto.alignment);
    }

    // Recalculate if necessary
    let recalculatedData: any = {};

    if (updateCharacterDto.abilityScores || updateCharacterDto.level || updateCharacterDto.classes) {
      const abilityScores = updateCharacterDto.abilityScores || character.abilityScores;
      const level = updateCharacterDto.level || character.level;
      const classes = updateCharacterDto.classes || character.classes;

      const proficiencyBonus = this.calculationService.calculateProficiencyBonus(level);
      const calculatedAbilities = this.calculationService.getAllAbilityScores(abilityScores);

      recalculatedData.proficiencyBonus = proficiencyBonus;

      // Recalculate skills if not explicitly provided
      if (!updateCharacterDto.skills) {
        recalculatedData.skills = this.calculationService.calculateAllSkills(
          calculatedAbilities,
          character.skills,
          proficiencyBonus,
        );
      }

      // Recalculate saving throws if not explicitly provided
      if (!updateCharacterDto.savingThrows) {
        recalculatedData.savingThrows = this.calculationService.calculateAllSavingThrows(
          calculatedAbilities,
          character.savingThrows,
          proficiencyBonus,
        );
      }

      // Recalculate initiative if not explicitly provided
      if (updateCharacterDto.initiative === undefined) {
        recalculatedData.initiative = this.calculationService.calculateInitiative(calculatedAbilities.dex.modifier);
      }

      // Recalculate spell slots if character has spellcasting
      if (character.spellcastingAbility && classes.length > 0) {
        const spellcastingClasses = classes.filter((c) => c.spellcastingFactor);
        if (spellcastingClasses.length > 0 && !updateCharacterDto.spellSlots) {
          recalculatedData.spellSlots = this.calculationService.calculateSpellSlots(spellcastingClasses);
        }

        // Recalculate spell save DC and attack bonus
        const spellAbility = updateCharacterDto.spellcastingAbility || character.spellcastingAbility;
        if (spellAbility) {
          const spellAbilityMod = calculatedAbilities[spellAbility]?.modifier || 0;
          if (updateCharacterDto.spellSaveDC === undefined) {
            recalculatedData.spellSaveDC = this.calculationService.calculateSpellSaveDC(spellAbilityMod, proficiencyBonus);
          }
          if (updateCharacterDto.spellAttackBonus === undefined) {
            recalculatedData.spellAttackBonus = this.calculationService.calculateSpellAttackBonus(
              spellAbilityMod,
              proficiencyBonus,
            );
          }
        }
      }
    }

    // Update character
    Object.assign(character, updateCharacterDto, recalculatedData);
    return character.save();
  }

  /**
   * Delete a character
   */
  async remove(id: string, userId: string): Promise<void> {
    const character = await this.findOne(id, userId);
    await character.deleteOne();
  }

  /**
   * Level up a character
   */
  async levelUp(id: string, userId: string, classKey: string, hitDiceRoll?: number): Promise<CharacterSheetDocument> {
    const character = await this.findOne(id, userId);

    // Find the class to level up
    const charClass = character.classes.find((c) => c.classKey === classKey);
    if (!charClass) {
      throw new NotFoundException(`Class ${classKey} not found on character`);
    }

    // Increase class level
    charClass.level += 1;
    const newTotalLevel = this.calculationService.calculateTotalLevel(character.classes);

    if (newTotalLevel > 20) {
      throw new ForbiddenException('Cannot exceed level 20');
    }

    // Calculate HP gain
    const abilityScores = this.calculationService.getAllAbilityScores(character.abilityScores);
    const hitDice = parseInt(charClass.hitDice?.replace('d', '') || '8');
    const hpGain = hitDiceRoll
      ? Math.max(1, hitDiceRoll + abilityScores.con.modifier)
      : this.calculationService.calculateHPGainOnLevelUp(hitDice, abilityScores.con.modifier);

    character.maxHitPoints += hpGain;
    character.currentHitPoints += hpGain;
    character.level = newTotalLevel;

    // Recalculate proficiency bonus
    character.proficiencyBonus = this.calculationService.calculateProficiencyBonus(newTotalLevel);

    // Recalculate skills and saves
    character.skills = this.calculationService.calculateAllSkills(
      abilityScores,
      character.skills,
      character.proficiencyBonus,
    );

    character.savingThrows = this.calculationService.calculateAllSavingThrows(
      abilityScores,
      character.savingThrows,
      character.proficiencyBonus,
    );

    // Recalculate spell slots if applicable
    if (character.spellcastingAbility) {
      const spellcastingClasses = character.classes.filter((c) => c.spellcastingFactor);
      if (spellcastingClasses.length > 0) {
        character.spellSlots = this.calculationService.calculateSpellSlots(spellcastingClasses);
        const spellAbilityMod = abilityScores[character.spellcastingAbility]?.modifier || 0;
        character.spellSaveDC = this.calculationService.calculateSpellSaveDC(spellAbilityMod, character.proficiencyBonus);
        character.spellAttackBonus = this.calculationService.calculateSpellAttackBonus(
          spellAbilityMod,
          character.proficiencyBonus,
        );
      }
    }

    return character.save();
  }

  /**
   * Initialize default skills
   */
  private initializeSkills(): Skills {
    const defaultSkill: Skill = { proficient: false, expertise: false, bonus: 0 };
    return {
      acrobatics: { ...defaultSkill },
      animalHandling: { ...defaultSkill },
      arcana: { ...defaultSkill },
      athletics: { ...defaultSkill },
      deception: { ...defaultSkill },
      history: { ...defaultSkill },
      insight: { ...defaultSkill },
      intimidation: { ...defaultSkill },
      investigation: { ...defaultSkill },
      medicine: { ...defaultSkill },
      nature: { ...defaultSkill },
      perception: { ...defaultSkill },
      performance: { ...defaultSkill },
      persuasion: { ...defaultSkill },
      religion: { ...defaultSkill },
      sleightOfHand: { ...defaultSkill },
      stealth: { ...defaultSkill },
      survival: { ...defaultSkill },
    };
  }

  /**
   * Initialize default saving throws
   */
  private initializeSavingThrows(): SavingThrows {
    const defaultSave: SavingThrow = { proficient: false, bonus: 0 };
    return {
      str: { ...defaultSave },
      dex: { ...defaultSave },
      con: { ...defaultSave },
      int: { ...defaultSave },
      wis: { ...defaultSave },
      cha: { ...defaultSave },
    };
  }
}

// Made with Bob
