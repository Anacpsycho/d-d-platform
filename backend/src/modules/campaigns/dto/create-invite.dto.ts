import { IsOptional, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInviteDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;
}

// Made with Bob
