import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMatchDto {
  @ApiProperty({ example: 'Cuartos de Final' })
  @IsString()
  @IsNotEmpty()
  roundName: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  matchNumber?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tableNumber?: number;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string; // PENDING, IN_PROGRESS, FINISHED

  // Jugador 1
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  player1Id?: string;

  @ApiPropertyOptional({ example: 'Camilo Montolla' })
  @IsOptional()
  @IsString()
  player1Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  player1Photo?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  player1Score?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  player1Innings?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  player1HighRun?: number;

  // Jugador 2
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  player2Id?: string;

  @ApiPropertyOptional({ example: 'Alexander Salazar' })
  @IsOptional()
  @IsString()
  player2Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  player2Photo?: string;

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  player2Score?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  player2Innings?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  player2HighRun?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalInnings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  winnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  winnerName?: string;
}

export class UpdateMatchDto extends CreateMatchDto {}
