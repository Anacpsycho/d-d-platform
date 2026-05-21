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
import { NpcsService } from './npcs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NPC } from './schemas/npc.schema';

@Controller('npcs')
@UseGuards(JwtAuthGuard)
export class NpcsController {
  constructor(private readonly npcsService: NpcsService) {}

  @Post()
  create(@Body() npcData: Partial<NPC>) {
    return this.npcsService.create(npcData.campaignId.toString(), npcData);
  }

  @Get()
  findAll(@Query('campaignId') campaignId: string) {
    return this.npcsService.findAll(campaignId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.npcsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<NPC>) {
    return this.npcsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.npcsService.remove(id);
  }

  @Patch(':id/hp')
  updateHp(
    @Param('id') id: string,
    @Body('currentHp') currentHp: number,
    @Body('temporaryHp') temporaryHp?: number,
  ) {
    return this.npcsService.updateHp(id, currentHp, temporaryHp);
  }
}

// Made with Bob
