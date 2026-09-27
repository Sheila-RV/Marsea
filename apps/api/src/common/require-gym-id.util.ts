import { ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '../modules/auth/jwt-payload.interface';

// La mayoría de rutas del dominio (disciplinas, planes, clases...) pertenecen
// a un gimnasio concreto. Solo SUPER_ADMIN no tiene gymId; si intenta usar
// una de estas rutas, es un 403 claro en vez de un gymId undefined colándose
// en una consulta de Prisma.
export function requireGymId(user: JwtPayload): string {
  if (!user.gymId) {
    throw new ForbiddenException('This action requires a gym context');
  }
  return user.gymId;
}
