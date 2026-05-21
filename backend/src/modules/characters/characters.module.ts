import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { CharacterSheet, CharacterSheetSchema } from './schemas/character-sheet.schema';
import { CalculationService } from './services/calculation.service';
import { ValidationService } from './services/validation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CharacterSheet.name, schema: CharacterSheetSchema },
    ]),
  ],
  controllers: [CharactersController],
  providers: [CharactersService, CalculationService, ValidationService],
  exports: [CharactersService, CalculationService, ValidationService],
})
export class CharactersModule {}

// Made with Bob
