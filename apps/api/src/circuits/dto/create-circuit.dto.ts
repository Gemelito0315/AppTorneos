import {
  IsBoolean, IsDateString, IsInt, IsNotEmpty,
  IsOptional, IsString, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCircuitDto {
  @ApiProperty({ example: 'Circuito Nocturno Viernes' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del circuito es obligatorio' })
  name: string;

  @ApiPropertyOptional({ example: 'Torneo semanal cada viernes, categoría libre' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'El campeón de 3 torneos seguidos gana un taco Predator',
    description: 'Texto libre explicando el incentivo para motivar jugadores',
  })
  @IsOptional()
  @IsString()
  incentiveRule?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Número de victorias consecutivas para obtener el incentivo',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetStreak?: number;

  @ApiPropertyOptional({
    example: '{"1":10,"2":6,"3":4,"4":2,"other":1}',
    description: 'JSON con puntos por posición. Clave "other" = posición mayor a 4',
  })
  @IsOptional()
  @IsString()
  pointsRuleJson?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
