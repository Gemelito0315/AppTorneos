import {
  IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min,
  ArrayNotEmpty, IsInt, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterPlayerDto {
  @ApiProperty({ example: 'player-uuid-here' })
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @ApiPropertyOptional({ example: 1, description: 'Número de cabeza de serie (seeding)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seedNumber?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  handicap?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkRegisterDto {
  @ApiProperty({ type: [String], example: ['player-id-1', 'player-id-2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  playerIds: string[];
}

class ResultEntry {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @ApiProperty({ example: 1, description: '1 = Campeón' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  position: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pointsAwarded?: number;
}

export class RegisterResultsDto {
  @ApiProperty({ type: [ResultEntry] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ResultEntry)
  results: ResultEntry[];
}

export class UpdateRegistrationStatusDto {
  @ApiProperty({ example: 'WITHDRAWN', enum: ['CONFIRMED', 'WITHDRAWN', 'PENDING'] })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ example: true, description: 'Si es true, marca W.O. a favor del oponente en partidas pendientes' })
  @IsOptional()
  markWalkover?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Si es true, elimina las partidas pendientes del jugador' })
  @IsOptional()
  removePendingMatches?: boolean;
}

export class ReplacePlayerDto {
  @ApiProperty({ example: 'new-player-uuid', description: 'ID del nuevo jugador que reemplazará al retirado' })
  @IsString()
  @IsNotEmpty()
  newPlayerId: string;

  @ApiPropertyOptional({ example: false, description: 'Si es true, elimina completamente la inscripción anterior en vez de marcarla WITHDRAWN' })
  @IsOptional()
  removeOld?: boolean;
}

