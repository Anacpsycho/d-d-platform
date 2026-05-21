import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CombatEncounter,
  CombatEncounterDocument,
  CombatStatus,
  CombatParticipant,
  ParticipantType,
} from './schemas/combat-encounter.schema';
import { GameEvent, GameEventDocument, GameEventType, ActorType } from '../events/schemas/game-event.schema';

@Injectable()
export class CombatService {
  constructor(
    @InjectModel(CombatEncounter.name)
    private combatModel: Model<CombatEncounterDocument>,
    @InjectModel(GameEvent.name)
    private eventModel: Model<GameEventDocument>,
  ) {}

  async create(
    sessionId: string,
    campaignId: string,
    location?: string,
    description?: string,
  ): Promise<CombatEncounter> {
    const combat = new this.combatModel({
      sessionId: new Types.ObjectId(sessionId),
      campaignId: new Types.ObjectId(campaignId),
      status: CombatStatus.PREPARING,
      currentRound: 0,
      currentTurnIndex: 0,
      participants: [],
      startTime: new Date(),
      location,
      description,
    });

    return combat.save();
  }

  async findOne(id: string): Promise<CombatEncounterDocument> {
    const combat = await this.combatModel.findById(id).exec();
    if (!combat) {
      throw new NotFoundException(`Combat encounter ${id} not found`);
    }
    return combat;
  }

  async findBySession(sessionId: string): Promise<CombatEncounterDocument | null> {
    return this.combatModel
      .findOne({
        sessionId: new Types.ObjectId(sessionId),
        status: { $in: [CombatStatus.PREPARING, CombatStatus.ACTIVE] },
      })
      .exec();
  }

  async addParticipant(
    combatId: string,
    participant: Omit<CombatParticipant, 'id' | 'isActive' | 'isDefeated'>,
  ): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);

    if (combat.status === CombatStatus.COMPLETED) {
      throw new BadRequestException('Cannot add participants to completed combat');
    }

    const newParticipant: CombatParticipant = {
      ...participant,
      id: new Types.ObjectId().toString(),
      isActive: false,
      isDefeated: false,
      conditions: participant.conditions || [],
    };

    combat.participants.push(newParticipant);
    return combat.save();
  }

  async removeParticipant(combatId: string, participantId: string): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);
    combat.participants = combat.participants.filter((p) => p.id !== participantId);
    return combat.save();
  }

  async updateParticipant(
    combatId: string,
    participantId: string,
    updates: Partial<CombatParticipant>,
  ): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);
    const participant = combat.participants.find((p) => p.id === participantId);

    if (!participant) {
      throw new NotFoundException(`Participant ${participantId} not found`);
    }

    Object.assign(participant, updates);
    return combat.save();
  }

  async startCombat(combatId: string): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);

    if (combat.status !== CombatStatus.PREPARING) {
      throw new BadRequestException('Combat already started');
    }

    if (combat.participants.length === 0) {
      throw new BadRequestException('Cannot start combat without participants');
    }

    // Ordina i partecipanti per iniziativa (decrescente)
    combat.participants.sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      // In caso di parità, usa il modificatore
      return b.initiativeModifier - a.initiativeModifier;
    });

    combat.status = CombatStatus.ACTIVE;
    combat.currentRound = 1;
    combat.currentTurnIndex = 0;
    combat.participants[0].isActive = true;

    await combat.save();

    // Crea evento COMBAT_STARTED
    const event = new this.eventModel({
      sessionId: combat.sessionId,
      campaignId: combat.campaignId,
      eventType: GameEventType.COMBAT_STARTED,
      actorType: ActorType.SYSTEM,
      eventData: {
        combatId: combat._id.toString(),
        participantCount: combat.participants.length,
      },
      result: {
        initiativeOrder: combat.participants.map((p) => ({
          id: p.id,
          name: p.name,
          initiative: p.initiative,
        })),
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    await event.save();

    // Crea evento ROUND_STARTED
    await this.createRoundStartedEvent(combat);

    // Crea evento TURN_STARTED per il primo partecipante
    await this.createTurnStartedEvent(combat, combat.participants[0]);

    return combat;
  }

  async nextTurn(combatId: string): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);

    if (combat.status !== CombatStatus.ACTIVE) {
      throw new BadRequestException('Combat is not active');
    }

    const currentParticipant = combat.participants[combat.currentTurnIndex];
    currentParticipant.isActive = false;

    // Crea evento TURN_ENDED
    await this.createTurnEndedEvent(combat, currentParticipant);

    // Passa al prossimo partecipante non sconfitto
    let nextIndex = (combat.currentTurnIndex + 1) % combat.participants.length;
    let attempts = 0;

    while (combat.participants[nextIndex].isDefeated && attempts < combat.participants.length) {
      nextIndex = (nextIndex + 1) % combat.participants.length;
      attempts++;
    }

    // Se tutti sono sconfitti, termina il combattimento
    if (attempts >= combat.participants.length) {
      return this.endCombat(combatId);
    }

    // Se siamo tornati all'inizio, incrementa il round
    if (nextIndex <= combat.currentTurnIndex) {
      combat.currentRound++;
      await this.createRoundStartedEvent(combat);
    }

    combat.currentTurnIndex = nextIndex;
    combat.participants[nextIndex].isActive = true;

    await combat.save();

    // Crea evento TURN_STARTED
    await this.createTurnStartedEvent(combat, combat.participants[nextIndex]);

    return combat;
  }

  async endCombat(combatId: string): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);

    if (combat.status === CombatStatus.COMPLETED) {
      throw new BadRequestException('Combat already ended');
    }

    combat.status = CombatStatus.COMPLETED;
    combat.endTime = new Date();

    // Disattiva tutti i partecipanti
    combat.participants.forEach((p) => {
      p.isActive = false;
    });

    await combat.save();

    // Crea evento COMBAT_ENDED
    const event = new this.eventModel({
      sessionId: combat.sessionId,
      campaignId: combat.campaignId,
      eventType: GameEventType.COMBAT_ENDED,
      actorType: ActorType.SYSTEM,
      eventData: {
        combatId: combat._id.toString(),
        totalRounds: combat.currentRound,
        duration: combat.endTime.getTime() - combat.startTime.getTime(),
      },
      result: {
        survivors: combat.participants
          .filter((p) => !p.isDefeated)
          .map((p) => ({ id: p.id, name: p.name })),
        defeated: combat.participants
          .filter((p) => p.isDefeated)
          .map((p) => ({ id: p.id, name: p.name })),
      },
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    await event.save();

    return combat;
  }

  async setParticipantDefeated(
    combatId: string,
    participantId: string,
    defeated: boolean,
  ): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);
    const participant = combat.participants.find((p) => p.id === participantId);

    if (!participant) {
      throw new NotFoundException(`Participant ${participantId} not found`);
    }

    participant.isDefeated = defeated;

    // Se era il turno del partecipante sconfitto, passa al prossimo
    if (defeated && participant.isActive) {
      return this.nextTurn(combatId);
    }

    return combat.save();
  }

  async updateParticipantHp(
    combatId: string,
    participantId: string,
    currentHp: number,
    temporaryHp?: number,
  ): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);
    const participant = combat.participants.find((p) => p.id === participantId);

    if (!participant) {
      throw new NotFoundException(`Participant ${participantId} not found`);
    }

    participant.currentHp = currentHp;
    if (temporaryHp !== undefined) {
      participant.temporaryHp = temporaryHp;
    }

    // Se gli HP scendono a 0 o meno, marca come sconfitto
    if (currentHp <= 0 && !participant.isDefeated) {
      participant.isDefeated = true;
      
      // Se era il suo turno, passa al prossimo
      if (participant.isActive) {
        return this.nextTurn(combatId);
      }
    }

    return combat.save();
  }

  async addCondition(
    combatId: string,
    participantId: string,
    condition: string,
  ): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);
    const participant = combat.participants.find((p) => p.id === participantId);

    if (!participant) {
      throw new NotFoundException(`Participant ${participantId} not found`);
    }

    if (!participant.conditions.includes(condition)) {
      participant.conditions.push(condition);
    }

    return combat.save();
  }

  async removeCondition(
    combatId: string,
    participantId: string,
    condition: string,
  ): Promise<CombatEncounterDocument> {
    const combat = await this.findOne(combatId);
    const participant = combat.participants.find((p) => p.id === participantId);

    if (!participant) {
      throw new NotFoundException(`Participant ${participantId} not found`);
    }

    participant.conditions = participant.conditions.filter((c) => c !== condition);
    return combat.save();
  }

  private async createRoundStartedEvent(combat: CombatEncounterDocument): Promise<void> {
    const event = new this.eventModel({
      sessionId: combat.sessionId,
      campaignId: combat.campaignId,
      eventType: GameEventType.ROUND_STARTED,
      actorType: ActorType.SYSTEM,
      eventData: {
        combatId: combat._id.toString(),
      },
      result: {
        roundNumber: combat.currentRound,
      },
      roundNumber: combat.currentRound,
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    await event.save();
  }

  private async createTurnStartedEvent(
    combat: CombatEncounterDocument,
    participant: CombatParticipant,
  ): Promise<void> {
    const event = new this.eventModel({
      sessionId: combat.sessionId,
      campaignId: combat.campaignId,
      eventType: GameEventType.TURN_STARTED,
      actorType: ActorType.SYSTEM,
      targetId: participant.characterId ? new Types.ObjectId(participant.characterId) : undefined,
      eventData: {
        combatId: combat._id.toString(),
        participantId: participant.id,
        participantName: participant.name,
      },
      result: {
        roundNumber: combat.currentRound,
        turnIndex: combat.currentTurnIndex,
      },
      roundNumber: combat.currentRound,
      turnOrder: combat.currentTurnIndex,
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    await event.save();
  }

  private async createTurnEndedEvent(
    combat: CombatEncounterDocument,
    participant: CombatParticipant,
  ): Promise<void> {
    const event = new this.eventModel({
      sessionId: combat.sessionId,
      campaignId: combat.campaignId,
      eventType: GameEventType.TURN_ENDED,
      actorType: ActorType.SYSTEM,
      targetId: participant.characterId ? new Types.ObjectId(participant.characterId) : undefined,
      eventData: {
        combatId: combat._id.toString(),
        participantId: participant.id,
        participantName: participant.name,
      },
      result: {
        roundNumber: combat.currentRound,
        turnIndex: combat.currentTurnIndex,
      },
      roundNumber: combat.currentRound,
      turnOrder: combat.currentTurnIndex,
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false,
    });

    await event.save();
  }
}

// Made with Bob
