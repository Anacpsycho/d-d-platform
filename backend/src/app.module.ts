import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CharactersModule } from './modules/characters/characters.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { EventsModule } from './modules/events/events.module';
import { CombatModule } from './modules/combat/combat.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NpcsModule } from './modules/npcs/npcs.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL') || 'mongodb://localhost:27017/dnd',
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per ttl
    }]),

    // Feature modules
    AuthModule,
    UsersModule,
    CharactersModule,
    CampaignsModule,
    SessionsModule,
    EventsModule,
    CombatModule,
    WebsocketModule,
    MessagingModule,
    NpcsModule,
  ],
})
export class AppModule {}

// Made with Bob
