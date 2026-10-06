import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que verifica el JWT de acceso en el header Authorization: Bearer <token>.
 * Extiende AuthGuard('jwt') que usa la JwtStrategy de Passport.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
