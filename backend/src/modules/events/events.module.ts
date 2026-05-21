import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { DamageService } from './services/damage.service';
import { HealingService } from './services/healing.service';
import { RestService } from './services/rest.service';
import { DiceService } from './services/dice.service';
import { GameEvent, GameEventSchema } from './schemas/game-event.schema';
import { CharacterSheet, CharacterSheetSchema } from '../characters/schemas/character-sheet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameEvent.name, schema: GameEventSchema },
      { name: CharacterSheet.name, schema: CharacterSheetSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    DamageService,
    HealingService,
    RestService,
    DiceService,
  ],
  exports: [
    EventsService,
    DamageService,
    HealingService,
    RestService,
    DiceService,
  ],
})
export class EventsModule {}

// Made with Bob
