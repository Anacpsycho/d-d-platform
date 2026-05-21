import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NpcsService } from './npcs.service';
import { NpcsController } from './npcs.controller';
import { NPC, NPCSchema } from './schemas/npc.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NPC.name, schema: NPCSchema }]),
  ],
  controllers: [NpcsController],
  providers: [NpcsService],
  exports: [NpcsService],
})
export class NpcsModule {}

// Made with Bob
