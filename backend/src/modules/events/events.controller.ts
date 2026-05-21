import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { DamageService, DamageType } from './services/damage.service';
import { HealingService } from './services/healing.service';
import { RestService } from './services/rest.service';
import { DiceService } from './services/dice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameEventType } from './schemas/game-event.schema';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly damageService: DamageService,
    private readonly healingService: HealingService,
    private readonly restService: RestService,
    private readonly diceService: DiceService,
  ) {}

  @Get('session/:sessionId')
  findBySession(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.findBySession(sessionId, limit);
  }

  @Get('campaign/:campaignId')
  findByCampaign(
    @Param('campaignId') campaignId: string,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.findByCampaign(campaignId, limit);
  }

  @Get('character/:characterId')
  findByCharacter(
    @Param('characterId') characterId: string,
    @Query('types') types?: string,
    @Query('limit') limit?: number,
  ) {
    const eventTypes = types ? types.split(',') as GameEventType[] : undefined;
    return this.eventsService.findByCharacter(characterId, eventTypes, limit);
  }

  @Get('session/:sessionId/stats')
  getEventStats(@Param('sessionId') sessionId: string) {
    return this.eventsService.getEventStats(sessionId);
  }

  @Get('session/:sessionId/combat')
  getCombatEvents(
    @Param('sessionId') sessionId: string,
    @Query('round') round?: number,
  ) {
    return this.eventsService.getCombatEvents(sessionId, round);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // Damage endpoints
  @Post('damage')
  applyDamage(
    @Body('characterId') characterId: string,
    @Body('damage') damage: number,
    @Body('damageType') damageType: string,
    @Body('source') source: string,
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.damageService.applyDamage(
      characterId,
      damage,
      damageType as any,
      source,
      sessionId,
      campaignId,
    );
  }

  @Post('damage/:eventId/rollback')
  rollbackDamage(@Param('eventId') eventId: string) {
    return this.damageService.rollbackDamage(eventId);
  }

  // Healing endpoints
  @Post('healing')
  applyHealing(
    @Body('characterId') characterId: string,
    @Body('healing') healing: number,
    @Body('source') source: string,
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.healingService.applyHealing(
      characterId,
      healing,
      source,
      sessionId,
      campaignId,
    );
  }

  @Post('temp-hp')
  applyTemporaryHp(
    @Body('characterId') characterId: string,
    @Body('tempHp') tempHp: number,
    @Body('source') source: string,
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.healingService.applyTemporaryHp(
      characterId,
      tempHp,
      source,
      sessionId,
      campaignId,
    );
  }

  // Rest endpoints
  @Post('rest/short')
  shortRest(
    @Body('characterId') characterId: string,
    @Body('hitDiceUsed') hitDiceUsed: { [diceType: string]: number },
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.restService.shortRest(
      characterId,
      hitDiceUsed,
      sessionId,
      campaignId,
    );
  }

  @Post('rest/long')
  longRest(
    @Body('characterId') characterId: string,
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.restService.longRest(characterId, sessionId, campaignId);
  }

  // Dice roll endpoints
  @Post('roll/ability-check')
  abilityCheck(
    @Body('characterId') characterId: string,
    @Body('ability') ability: string,
    @Body('dc') dc: number,
    @Body('modifier') modifier: number,
    @Body('advantage') advantage: 'advantage' | 'disadvantage' | 'normal',
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.diceService.recordAbilityCheck(
      characterId,
      ability,
      dc,
      modifier,
      advantage,
      sessionId,
      campaignId,
    );
  }

  @Post('roll/saving-throw')
  savingThrow(
    @Body('characterId') characterId: string,
    @Body('ability') ability: string,
    @Body('dc') dc: number,
    @Body('modifier') modifier: number,
    @Body('advantage') advantage: 'advantage' | 'disadvantage' | 'normal',
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.diceService.recordSavingThrow(
      characterId,
      ability,
      dc,
      modifier,
      advantage,
      sessionId,
      campaignId,
    );
  }

  @Post('roll/attack')
  attackRoll(
    @Body('characterId') characterId: string,
    @Body('targetId') targetId: string,
    @Body('attackName') attackName: string,
    @Body('attackBonus') attackBonus: number,
    @Body('advantage') advantage: 'advantage' | 'disadvantage' | 'normal',
    @Body('targetAC') targetAC: number,
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.diceService.recordAttackRoll(
      characterId,
      targetId,
      attackName,
      attackBonus,
      advantage,
      targetAC,
      sessionId,
      campaignId,
    );
  }

  @Post('roll/damage')
  damageRoll(
    @Body('characterId') characterId: string,
    @Body('targetId') targetId: string,
    @Body('damageFormula') damageFormula: string,
    @Body('damageType') damageType: string,
    @Body('isCritical') isCritical: boolean,
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.diceService.recordDamageRoll(
      characterId,
      targetId,
      damageFormula,
      damageType,
      isCritical,
      sessionId,
      campaignId,
    );
  }

  @Post('roll/skill-check')
  skillCheck(
    @Body('characterId') characterId: string,
    @Body('skill') skill: string,
    @Body('dc') dc: number,
    @Body('modifier') modifier: number,
    @Body('advantage') advantage: 'advantage' | 'disadvantage' | 'normal',
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.diceService.recordSkillCheck(
      characterId,
      skill,
      dc,
      modifier,
      advantage,
      sessionId,
      campaignId,
    );
  }

  @Post('roll/initiative')
  initiativeRoll(
    @Body('characterId') characterId: string,
    @Body('modifier') modifier: number,
    @Body('advantage') advantage: 'advantage' | 'disadvantage' | 'normal',
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
  ) {
    return this.diceService.recordInitiativeRoll(
      characterId,
      modifier,
      advantage,
      sessionId,
      campaignId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }
}

// Made with Bob
