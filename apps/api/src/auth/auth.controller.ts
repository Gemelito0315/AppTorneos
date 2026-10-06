import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo administrador y su club/organización' })
  @ApiResponse({ status: 201, description: 'Usuario y club registrados exitosamente' })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.authService.register(dto, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiResponse({ status: 200, description: 'Credenciales correctas, retorna tokens' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.authService.login(dto, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar Access Token mediante Refresh Token' })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado actual' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario y organización' })
  async getProfile(@CurrentUser() user: any) {
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
      },
      organization: user.organization,
    };
  }
}
