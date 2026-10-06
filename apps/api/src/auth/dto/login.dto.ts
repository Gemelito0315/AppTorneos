import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@losmaestrosbillar.com', description: 'Correo electrónico' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Admin12345!', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
