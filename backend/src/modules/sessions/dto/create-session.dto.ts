import { IsString, IsDate, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionStatus } from '../schemas/game-session.schema';

export class CreateSessionDto {
  @IsString()
  campaignId: string;

  @IsNumber()
  sessionNumber: number;

  @IsDate()
  @Type(() => Date)
  sessionDate: Date;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endTime?: Date;

  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @IsString()
  masterUserId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  playerCharacterIds?: string[];

  @IsString()
  @IsOptional()
  inGameDate?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  summary?: string;
}

// Made with Bob
