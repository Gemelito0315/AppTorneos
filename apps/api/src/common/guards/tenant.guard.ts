import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado para validar organización');
    }

    if (user.role === 'SUPERADMIN') {
      return true;
    }

    if (!user.organizationId) {
      throw new ForbiddenException('El usuario no pertenece a ninguna organización activa');
    }

    return true;
  }
}
