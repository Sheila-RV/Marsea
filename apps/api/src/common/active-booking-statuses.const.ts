import { BookingStatus } from '../generated/prisma/client.js';

// Una reserva "ocupa cupo" mientras está BOOKED o ya se marcó ATTENDED.
// CANCELLED y NO_SHOW liberan el cupo. Usado por ClassSessions, Bookings y
// CheckIn para calcular capacidad y detectar reservas duplicadas.
export const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  BookingStatus.BOOKED,
  BookingStatus.ATTENDED,
];
