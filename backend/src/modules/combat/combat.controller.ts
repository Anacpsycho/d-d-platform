import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CombatService } from './combat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CombatParticipant } from './schemas/combat-encounter.schema';

@Controller('combat')
@UseGuards(JwtAuthGuard)
export class CombatController {
  constructor(private readonly combatService: CombatService) {}

  @Post()
  create(
    @Body('sessionId') sessionId: string,
    @Body('campaignId') campaignId: string,
    @Body('location') location?: string,
    @Body('description') description?: string,
  ) {
    return this.combatService.create(sessionId, campaignId, location, description);
  }

  @Get('session/:sessionId')
  findBySession(@Param('sessionId') sessionId: string) {
    return this.combatService.findBySession(sessionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.combatService.findOne(id);
  }

  @Post(':id/participants')
  addParticipant(
    @Param('id') id: string,
    @Body() participant: Omit<CombatParticipant, 'id' | 'isActive' | 'isDefeated'>,
  ) {
    return this.combatService.addParticipant(id, participant);
  }

  @Delete(':id/participants/:participantId')
  removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    return this.combatService.removeParticipant(id, participantId);
  }

  @Patch(':id/participants/:participantId')
  updateParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body() updates: Partial<CombatParticipant>,
  ) {
    return this.combatService.updateParticipant(id, participantId, updates);
  }

  @Post(':id/start')
  startCombat(@Param('id') id: string) {
    return this.combatService.startCombat(id);
  }

  @Post(':id/next-turn')
  nextTurn(@Param('id') id: string) {
    return this.combatService.nextTurn(id);
  }

  @Post(':id/end')
  endCombat(@Param('id') id: string) {
    return this.combatService.endCombat(id);
  }

  @Patch(':id/participants/:participantId/defeated')
  setParticipantDefeated(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body('defeated') defeated: boolean,
  ) {
    return this.combatService.setParticipantDefeated(id, participantId, defeated);
  }

  @Patch(':id/participants/:participantId/hp')
  updateParticipantHp(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body('currentHp') currentHp: number,
    @Body('temporaryHp') temporaryHp?: number,
  ) {
    return this.combatService.updateParticipantHp(id, participantId, currentHp, temporaryHp);
  }

  @Post(':id/participants/:participantId/conditions')
  addCondition(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Body('condition') condition: string,
  ) {
    return this.combatService.addCondition(id, participantId, condition);
  }

  @Delete(':id/participants/:participantId/conditions/:condition')
  removeCondition(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Param('condition') condition: string,
  ) {
    return this.combatService.removeCondition(id, participantId, condition);
  }
}

// Made with Bob
