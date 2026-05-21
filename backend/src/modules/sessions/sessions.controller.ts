import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get()
  findAll(@Query('campaignId') campaignId: string) {
    return this.sessionsService.findAll(campaignId);
  }

  @Get('active')
  findActive(@Query('campaignId') campaignId: string) {
    return this.sessionsService.findActive(campaignId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }

  @Post(':id/start')
  startSession(@Param('id') id: string, @Request() req) {
    return this.sessionsService.startSession(id, req.user.userId);
  }

  @Post(':id/end')
  endSession(
    @Param('id') id: string,
    @Body('summary') summary: string,
    @Request() req,
  ) {
    return this.sessionsService.endSession(id, req.user.userId, summary);
  }

  @Post(':id/characters/:characterId')
  addPlayerCharacter(
    @Param('id') id: string,
    @Param('characterId') characterId: string,
    @Request() req,
  ) {
    return this.sessionsService.addPlayerCharacter(id, characterId, req.user.userId);
  }

  @Delete(':id/characters/:characterId')
  removePlayerCharacter(
    @Param('id') id: string,
    @Param('characterId') characterId: string,
    @Request() req,
  ) {
    return this.sessionsService.removePlayerCharacter(id, characterId, req.user.userId);
  }
}

// Made with Bob
