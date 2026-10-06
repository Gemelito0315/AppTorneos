import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Token de refresco obtenido en el inicio de sesión' })
  @IsString()
  @IsNotEmpty({ message: 'El refreshToken es requerido' })
  refreshToken: string;
}
