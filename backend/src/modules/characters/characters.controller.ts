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
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('sub') userId: string, @Body() createCharacterDto: CreateCharacterDto) {
    return this.charactersService.create(userId, createCharacterDto);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.charactersService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.charactersService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, userId, updateCharacterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.charactersService.remove(id, userId);
  }

  @Post(':id/level-up')
  levelUp(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { classKey: string; hitDiceRoll?: number },
  ) {
    return this.charactersService.levelUp(id, userId, body.classKey, body.hitDiceRoll);
  }
}

// Made with Bob
