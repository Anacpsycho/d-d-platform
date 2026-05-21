import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('sub') userId: string, @Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(userId, createCampaignDto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.campaignsService.findAll(userId);
  }

  @Get('as-master')
  findAsMaster(@CurrentUser('sub') userId: string) {
    return this.campaignsService.findAsMaster(userId);
  }

  @Get('as-player')
  findAsPlayer(@CurrentUser('sub') userId: string) {
    return this.campaignsService.findAsPlayer(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.campaignsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, userId, updateCampaignDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.campaignsService.remove(id, userId);
  }

  @Post(':id/invite')
  @HttpCode(HttpStatus.CREATED)
  createInvite(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() createInviteDto: CreateInviteDto,
  ) {
    return this.campaignsService.createInvite(id, userId, createInviteDto);
  }

  @Get(':id/invites')
  getInvites(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.campaignsService.getInvites(id, userId);
  }

  @Post('join/:inviteCode')
  joinCampaign(@Param('inviteCode') inviteCode: string, @CurrentUser('sub') userId: string) {
    return this.campaignsService.joinCampaign(inviteCode, userId);
  }

  @Delete(':id/players/:playerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePlayer(
    @Param('id') id: string,
    @Param('playerId') playerId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.campaignsService.removePlayer(id, userId, playerId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  leaveCampaign(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.campaignsService.leaveCampaign(id, userId);
  }

  @Patch('invites/:inviteId/revoke')
  revokeInvite(@Param('inviteId') inviteId: string, @CurrentUser('sub') userId: string) {
    return this.campaignsService.revokeInvite(inviteId, userId);
  }

  @Patch(':id/sources')
  updateSources(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() sources: { allowedSources: any[]; excludedResources: any },
  ) {
    return this.campaignsService.updateSources(id, userId, sources);
  }
}

// Made with Bob
