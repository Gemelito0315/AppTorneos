import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'juan.perez@ejemplo.com', description: 'Correo electrónico' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'ClaveSegura123!', description: 'Contraseña del usuario', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del administrador' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName: string;

  @ApiProperty({ example: 'Club Central de Billar', description: 'Nombre del Club u Organización a crear' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la organización o club es requerido' })
  organizationName: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Bogotá', description: 'Ciudad donde opera el club' })
  @IsOptional()
  @IsString()
  city?: string;
}
