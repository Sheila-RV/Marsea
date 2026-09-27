// Tipos que reflejan las respuestas reales de la API (apps/api).
// Se mantienen a mano en cada frontend porque los dos proyectos son
// independientes (sin workspace compartido), igual que decidimos para api/web.

export type Role = "SUPER_ADMIN" | "ADMIN" | "MEMBER";

export interface JwtPayload {
  sub: string;
  role: Role;
  gymId: string | null;
  iat: number;
  exp: number;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  gymId: string | null;
  isActive: boolean;
}

export interface PlanDisciplineRef {
  id: string;
  name: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  isActive: boolean;
  gymId: string;
  disciplines: PlanDisciplineRef[];
}

export type MembershipStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface Membership {
  id: string;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  gymId: string;
  userId: string;
  planId: string;
}

export interface ActiveMembership {
  id: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  disciplineIds: string[];
}

export type ClassSessionStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export interface ClassSession {
  id: string;
  disciplineId: string;
  disciplineName: string;
  instructorName: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: ClassSessionStatus;
  bookedCount: number;
  remainingCapacity: number;
  isBookedByMe: boolean;
  myBookingId: string | null;
}

export type BookingStatus = "BOOKED" | "CANCELLED" | "ATTENDED" | "NO_SHOW";

export interface MyBooking {
  id: string;
  status: BookingStatus;
  bookedAt: string;
  checkedInAt: string | null;
  classSessionId: string;
  classSession: {
    id: string;
    startsAt: string;
    endsAt: string;
    instructorName: string;
    discipline: { id: string; name: string };
  };
}

export interface SessionBooking {
  id: string;
  status: BookingStatus;
  bookedAt: string;
  checkedInAt: string | null;
  classSessionId: string;
  userId: string;
  userFullName: string;
}

export interface CheckInResult {
  bookingId: string;
  memberFullName: string;
  disciplineName: string;
  startsAt: string;
  checkedInAt: string;
}

export interface QrCodeResponse {
  qrCode: string;
  qrImage: string;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
