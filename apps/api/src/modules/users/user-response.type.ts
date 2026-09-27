import type { Role } from '../../generated/prisma/client.js';

// Lo que exponemos por HTTP. Nunca incluye passwordHash ni qrCode
// (el qrCode tiene su propio endpoint, más restringido).
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  gymId: string | null;
  isActive: boolean;
}
