import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CampaignInvite, CampaignInviteDocument } from './schemas/campaign-invite.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import * as crypto from 'crypto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name)
    private campaignModel: Model<CampaignDocument>,
    @InjectModel(CampaignInvite.name)
    private inviteModel: Model<CampaignInviteDocument>,
  ) {}

  /**
   * Create a new campaign
   */
  async create(masterId: string, createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const campaign = new this.campaignModel({
      masterId: new Types.ObjectId(masterId),
      ...createCampaignDto,
      playerIds: [],
      status: 'active',
    });

    return campaign.save();
  }

  /**
   * Find all campaigns where user is master or player
   */
  async findAll(userId: string): Promise<Campaign[]> {
    const userObjectId = new Types.ObjectId(userId);
    
    return this.campaignModel
      .find({
        $or: [
          { masterId: userObjectId },
          { playerIds: userObjectId },
        ],
      })
      .exec();
  }

  /**
   * Find campaigns where user is master
   */
  async findAsMaster(userId: string): Promise<Campaign[]> {
    return this.campaignModel
      .find({ masterId: new Types.ObjectId(userId) })
      .exec();
  }

  /**
   * Find campaigns where user is player
   */
  async findAsPlayer(userId: string): Promise<Campaign[]> {
    return this.campaignModel
      .find({ playerIds: new Types.ObjectId(userId) })
      .exec();
  }

  /**
   * Find one campaign by ID
   */
  async findOne(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(id).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Check if user has access (master or player)
    const userObjectId = new Types.ObjectId(userId);
    const isMaster = campaign.masterId.equals(userObjectId);
    const isPlayer = campaign.playerIds.some((playerId) => playerId.equals(userObjectId));

    if (!isMaster && !isPlayer) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return campaign;
  }

  /**
   * Update a campaign (master only)
   */
  async update(id: string, userId: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(id).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only master can update
    if (!campaign.masterId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the campaign master can update the campaign');
    }

    Object.assign(campaign, updateCampaignDto);
    return campaign.save();
  }

  /**
   * Delete a campaign (master only)
   */
  async remove(id: string, userId: string): Promise<void> {
    const campaign = await this.campaignModel.findById(id).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only master can delete
    if (!campaign.masterId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the campaign master can delete the campaign');
    }

    // Delete all invites for this campaign
    await this.inviteModel.deleteMany({ campaignId: campaign._id }).exec();

    await campaign.deleteOne();
  }

  /**
   * Create an invite code for a campaign
   */
  async createInvite(campaignId: string, userId: string, createInviteDto: CreateInviteDto): Promise<CampaignInvite> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only master can create invites
    if (!campaign.masterId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the campaign master can create invites');
    }

    // Generate unique invite code
    const inviteCode = this.generateInviteCode();

    const invite = new this.inviteModel({
      campaignId: campaign._id,
      inviteCode,
      createdBy: new Types.ObjectId(userId),
      expiresAt: createInviteDto.expiresAt,
      maxUses: createInviteDto.maxUses,
      usedCount: 0,
      status: 'active',
      usedBy: [],
    });

    return invite.save();
  }

  /**
   * Join a campaign using an invite code
   */
  async joinCampaign(inviteCode: string, userId: string): Promise<Campaign> {
    const invite = await this.inviteModel.findOne({ inviteCode }).exec();
    
    if (!invite) {
      throw new NotFoundException('Invalid invite code');
    }

    // Check if invite is active
    if (invite.status !== 'active') {
      throw new BadRequestException('This invite is no longer active');
    }

    // Check if invite has expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      invite.status = 'expired';
      await invite.save();
      throw new BadRequestException('This invite has expired');
    }

    // Check if invite has reached max uses
    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      invite.status = 'expired';
      await invite.save();
      throw new BadRequestException('This invite has reached its maximum uses');
    }

    // Get campaign
    const campaign = await this.campaignModel.findById(invite.campaignId).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const userObjectId = new Types.ObjectId(userId);

    // Check if user is already in campaign
    if (campaign.playerIds.some((playerId) => playerId.equals(userObjectId))) {
      throw new BadRequestException('You are already a member of this campaign');
    }

    // Check if user is the master
    if (campaign.masterId.equals(userObjectId)) {
      throw new BadRequestException('You are the master of this campaign');
    }

    // Add user to campaign
    campaign.playerIds.push(userObjectId);
    await campaign.save();

    // Update invite usage
    invite.usedCount += 1;
    invite.usedBy.push(userObjectId);
    
    // Mark as expired if max uses reached
    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      invite.status = 'expired';
    }
    
    await invite.save();

    return campaign;
  }

  /**
   * Remove a player from a campaign (master only)
   */
  async removePlayer(campaignId: string, userId: string, playerIdToRemove: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only master can remove players
    if (!campaign.masterId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the campaign master can remove players');
    }

    const playerObjectId = new Types.ObjectId(playerIdToRemove);

    // Check if player is in campaign
    const playerIndex = campaign.playerIds.findIndex((playerId) => playerId.equals(playerObjectId));
    
    if (playerIndex === -1) {
      throw new NotFoundException('Player not found in campaign');
    }

    // Remove player
    campaign.playerIds.splice(playerIndex, 1);
    return campaign.save();
  }

  /**
   * Leave a campaign (player only)
   */
  async leaveCampaign(campaignId: string, userId: string): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const userObjectId = new Types.ObjectId(userId);

    // Master cannot leave their own campaign
    if (campaign.masterId.equals(userObjectId)) {
      throw new BadRequestException('Campaign master cannot leave. Delete the campaign instead.');
    }

    // Check if user is in campaign
    const playerIndex = campaign.playerIds.findIndex((playerId) => playerId.equals(userObjectId));
    
    if (playerIndex === -1) {
      throw new NotFoundException('You are not a member of this campaign');
    }

    // Remove player
    campaign.playerIds.splice(playerIndex, 1);
    await campaign.save();
  }

  /**
   * Get all invites for a campaign (master only)
   */
  async getInvites(campaignId: string, userId: string): Promise<CampaignInvite[]> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only master can view invites
    if (!campaign.masterId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the campaign master can view invites');
    }

    return this.inviteModel.find({ campaignId: campaign._id }).exec();
  }

  /**
   * Revoke an invite (master only)
   */
  async revokeInvite(inviteId: string, userId: string): Promise<CampaignInvite> {
    const invite = await this.inviteModel.findById(inviteId).exec();
    
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const campaign = await this.campaignModel.findById(invite.campaignId).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only master can revoke invites
    if (!campaign.masterId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the campaign master can revoke invites');
    }

    invite.status = 'revoked';
    return invite.save();
  }

  /**
   * Update campaign sources (master only)
   */
  async updateSources(
    campaignId: string,
    userId: string,
    sources: { allowedSources: any[]; excludedResources: any },
  ): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only master can update sources
    if (!campaign.masterId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the campaign master can update sources');
    }

    campaign.allowedSources = sources.allowedSources;
    campaign.excludedResources = sources.excludedResources;
    
    return campaign.save();
  }

  /**
   * Generate a unique invite code
   */
  private generateInviteCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }
}

// Made with Bob
