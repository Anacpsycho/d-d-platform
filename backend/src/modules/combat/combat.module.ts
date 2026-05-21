import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombatService } from './combat.service';
import { CombatController } from './combat.controller';
import { InitiativeService } from './services/initiative.service';
import { CombatEncounter, CombatEncounterSchema } from './schemas/combat-encounter.schema';
import { GameEvent, GameEventSchema } from '../events/schemas/game-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CombatEncounter.name, schema: CombatEncounterSchema },
      { name: GameEvent.name, schema: GameEventSchema },
    ]),
  ],
  controllers: [CombatController],
  providers: [CombatService, InitiativeService],
  exports: [CombatService, InitiativeService],
})
export class CombatModule {}

// Made with Bob
