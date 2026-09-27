// Campos seguros para cualquier respuesta HTTP: nunca passwordHash ni qrCode.
// Compartido entre UsersService y GymsService (que también devuelve un User
// al crear el primer admin de un gimnasio).
export const USER_SELECT_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  gymId: true,
  isActive: true,
} as const;
