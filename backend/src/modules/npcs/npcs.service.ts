import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NPC, NPCDocument } from './schemas/npc.schema';

@Injectable()
export class NpcsService {
  constructor(
    @InjectModel(NPC.name)
    private npcModel: Model<NPCDocument>,
  ) {}

  async create(campaignId: string, npcData: Partial<NPC>): Promise<NPC> {
    const npc = new this.npcModel({
      ...npcData,
      campaignId: new Types.ObjectId(campaignId),
      hitPoints: {
        current: npcData.hitPoints?.max || 0,
        max: npcData.hitPoints?.max || 0,
        temporary: 0,
      },
    });

    return npc.save();
  }

  async findAll(campaignId: string): Promise<NPC[]> {
    return this.npcModel
      .find({ campaignId: new Types.ObjectId(campaignId) })
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<NPC> {
    const npc = await this.npcModel.findById(id).exec();
    if (!npc) {
      throw new NotFoundException(`NPC with ID ${id} not found`);
    }
    return npc;
  }

  async update(id: string, updateData: Partial<NPC>): Promise<NPC> {
    const npc = await this.npcModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!npc) {
      throw new NotFoundException(`NPC with ID ${id} not found`);
    }

    return npc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.npcModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`NPC with ID ${id} not found`);
    }
  }

  async updateHp(id: string, currentHp: number, temporaryHp?: number): Promise<NPC> {
    const npc = await this.npcModel.findById(id);
    if (!npc) {
      throw new NotFoundException(`NPC with ID ${id} not found`);
    }
    npc.hitPoints.current = currentHp;
    if (temporaryHp !== undefined) {
      npc.hitPoints.temporary = temporaryHp;
    }
    return npc.save();
  }
}

// Made with Bob
