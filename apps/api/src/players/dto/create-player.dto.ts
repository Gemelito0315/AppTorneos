import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePlayerDto {
  @ApiProperty({ example: 'Carlos Andrés Montoya' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  @ApiPropertyOptional({ example: 'El Maestro' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'carlos@email.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 5, description: 'Handicap del jugador (carambolas/puntos extra)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  handicap?: number;

  @ApiPropertyOptional({ example: 0.45, description: 'Promedio base histórico del jugador' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseAverage?: number;

  @ApiPropertyOptional({ example: 'https://ejemplo.com/foto.jpg', description: 'URL o Base64 de la foto del jugador' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'Jugador de fin de semana, juega los viernes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
