import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../../modules/auth/jwt-payload.interface';

interface RequestWithUser {
  user: JwtPayload;
}

// Extrae request.user, que JwtStrategy dejó ahí tras validar el token.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
