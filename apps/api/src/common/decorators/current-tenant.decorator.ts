import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return user.organizationId;
  },
);
