import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Club Central Los Campeones' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Club especializado en torneos de 3 bandas y pool' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://ejemplo.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '+57 300 987 6543' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@clubcampeones.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Medellín' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CO' })
  @IsOptional()
  @IsString()
  country?: string;
}
