import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GameSession, GameSessionDocument, SessionStatus } from './schemas/game-session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(GameSession.name)
    private sessionModel: Model<GameSessionDocument>,
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<GameSession> {
    const session = new this.sessionModel({
      ...createSessionDto,
      campaignId: new Types.ObjectId(createSessionDto.campaignId),
      masterUserId: new Types.ObjectId(createSessionDto.masterUserId),
      playerCharacterIds: createSessionDto.playerCharacterIds?.map(
        (id) => new Types.ObjectId(id),
      ) || [],
    });
    return session.save();
  }

  async findAll(campaignId: string): Promise<GameSession[]> {
    return this.sessionModel
      .find({ campaignId: new Types.ObjectId(campaignId) })
      .sort({ sessionNumber: -1 })
      .populate('masterUserId', 'username email')
      .populate('playerCharacterIds', 'name class level')
      .exec();
  }

  async findOne(id: string): Promise<GameSession> {
    const session = await this.sessionModel
      .findById(id)
      .populate('masterUserId', 'username email')
      .populate('playerCharacterIds', 'name class level')
      .populate('currentCombatId')
      .exec();

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async findActive(campaignId: string): Promise<GameSession | null> {
    return this.sessionModel
      .findOne({
        campaignId: new Types.ObjectId(campaignId),
        status: SessionStatus.ACTIVE,
      })
      .populate('masterUserId', 'username email')
      .populate('playerCharacterIds', 'name class level')
      .exec();
  }

  async update(id: string, updateSessionDto: UpdateSessionDto): Promise<GameSession> {
    const updateData: any = { ...updateSessionDto };

    if (updateSessionDto.campaignId) {
      updateData.campaignId = new Types.ObjectId(updateSessionDto.campaignId);
    }
    if (updateSessionDto.masterUserId) {
      updateData.masterUserId = new Types.ObjectId(updateSessionDto.masterUserId);
    }
    if (updateSessionDto.playerCharacterIds) {
      updateData.playerCharacterIds = updateSessionDto.playerCharacterIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    const session = await this.sessionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('masterUserId', 'username email')
      .populate('playerCharacterIds', 'name class level')
      .exec();

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async remove(id: string): Promise<void> {
    const result = await this.sessionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
  }

  async startSession(id: string, userId: string): Promise<GameSession> {
    const session = await this.findOne(id);

    if (session.masterUserId.toString() !== userId) {
      throw new ForbiddenException('Only the master can start the session');
    }

    if (session.status === SessionStatus.ACTIVE) {
      throw new ForbiddenException('Session is already active');
    }

    return this.update(id, {
      status: SessionStatus.ACTIVE,
      startTime: new Date(),
    });
  }

  async endSession(id: string, userId: string, summary?: string): Promise<GameSession> {
    const session = await this.findOne(id);

    if (session.masterUserId.toString() !== userId) {
      throw new ForbiddenException('Only the master can end the session');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException('Session is not active');
    }

    return this.update(id, {
      status: SessionStatus.COMPLETED,
      endTime: new Date(),
      summary,
    });
  }

  async addPlayerCharacter(
    sessionId: string,
    characterId: string,
    userId: string,
  ): Promise<GameSession> {
    const session = await this.findOne(sessionId);

    if (session.masterUserId.toString() !== userId) {
      throw new ForbiddenException('Only the master can add characters');
    }

    const characterIds = session.playerCharacterIds.map((id) => id.toString());
    if (!characterIds.includes(characterId)) {
      characterIds.push(characterId);
    }

    return this.update(sessionId, {
      playerCharacterIds: characterIds,
    });
  }

  async removePlayerCharacter(
    sessionId: string,
    characterId: string,
    userId: string,
  ): Promise<GameSession> {
    const session = await this.findOne(sessionId);

    if (session.masterUserId.toString() !== userId) {
      throw new ForbiddenException('Only the master can remove characters');
    }

    const characterIds = session.playerCharacterIds
      .map((id) => id.toString())
      .filter((id) => id !== characterId);

    return this.update(sessionId, {
      playerCharacterIds: characterIds,
    });
  }

  async setCurrentCombat(
    sessionId: string,
    combatId: string | null,
  ): Promise<GameSession> {
    return this.update(sessionId, {
      currentCombatId: combatId || undefined,
    } as any);
  }
}

// Made with Bob
