import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/client.js';

// Adjunta la lista de roles permitidos como metadata del handler/clase.
// RolesGuard la lee con Reflector y la compara contra request.user.role.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
