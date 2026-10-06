import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TOURNAMENT_STATUS, TournamentStatus } from '@billar/shared';

export class UpdateTournamentDto {
  @ApiPropertyOptional({ example: 'Torneo Abierto de Carambola a Tres Bandas 2026 - Edición Especial' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modalityId?: string;

  @ApiPropertyOptional({ enum: Object.values(TOURNAMENT_STATUS) })
  @IsOptional()
  @IsIn(Object.values(TOURNAMENT_STATUS))
  status?: TournamentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  posterUrl?: string;
}
