import type { Role } from '../../generated/prisma/client.js';

// Lo que viaja firmado dentro del token, y lo que termina en request.user
// una vez que JwtStrategy lo valida.
export interface JwtPayload {
  sub: string; // id del usuario
  role: Role;
  gymId: string | null; // null solo para SUPER_ADMIN
}
