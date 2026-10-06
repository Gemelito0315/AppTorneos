import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TOURNAMENT_STATUS, TournamentStatus } from '@billar/shared';

export class CreateTournamentDto {
  @ApiProperty({ example: 'Torneo Abierto de Carambola a Tres Bandas 2026' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del torneo es obligatorio' })
  name: string;

  @ApiPropertyOptional({ example: 'Torneo abierto individual con handicap y fase de grupos.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Sede Principal Club Los Maestros - Carrera 70 # 45-12' })
  @IsString()
  @IsNotEmpty({ message: 'La sede es obligatoria' })
  venue: string;

  @ApiProperty({ example: '2026-11-15T09:00:00Z', description: 'Fecha y hora de inicio ISO' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha ISO válida' })
  startDate: string;

  @ApiProperty({ example: '2026-11-17T20:00:00Z', description: 'Fecha y hora de finalización ISO' })
  @IsDateString({}, { message: 'La fecha de finalización debe ser una fecha ISO válida' })
  endDate: string;

  @ApiProperty({ description: 'ID de la modalidad de billar' })
  @IsString()
  @IsNotEmpty({ message: 'La modalidad es obligatoria' })
  modalityId: string;

  @ApiPropertyOptional({
    enum: Object.values(TOURNAMENT_STATUS),
    default: TOURNAMENT_STATUS.DRAFT,
  })
  @IsOptional()
  @IsIn(Object.values(TOURNAMENT_STATUS), { message: 'Estado del torneo no válido' })
  status?: TournamentStatus;

  @ApiPropertyOptional({ default: true, description: 'Indica si el torneo es público' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'contacto@torneosbillar.com' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://ejemplo.com/afiche.jpg' })
  @IsOptional()
  @IsString()
  posterUrl?: string;
}
