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

export interface Discipline {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  gymId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringClass {
  id: string;
  disciplineId: string;
  disciplineName: string;
  instructorName: string;
  capacity: number;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  rangeStart: string;
  rangeEnd: string;
  isActive: boolean;
  generatedSessionsCount: number;
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

export interface Gym {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logoUrl: string | null;
  isActive: boolean;
}

export interface GymWithFirstAdmin {
  gym: Gym;
  admin: UserResponse;
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

export interface BookingsPerDay {
  date: string;
  count: number;
}

export interface MembershipsByPlan {
  planId: string;
  planName: string;
  count: number;
}

export interface RecentBooking {
  id: string;
  memberFullName: string;
  disciplineName: string;
  classStartsAt: string;
  status: BookingStatus;
  bookedAt: string;
}

export interface AdminDashboard {
  totalMembers: number;
  membersDeltaPct: number | null;
  activeMemberships: number;
  upcomingClassSessions: number;
  bookings30d: {
    total: number;
    deltaPct: number | null;
    confirmed: number;
    cancelled: number;
    pending: number;
  };
  monthlyMembershipRevenue: string;
  bookingsPerDay: BookingsPerDay[];
  membershipsByPlan: MembershipsByPlan[];
  recentBookings: RecentBooking[];
}

export interface GymMemberCount {
  gymId: string;
  gymName: string;
  activeMembers: number;
}

export interface SuperAdminDashboard {
  totalGyms: number;
  activeGyms: number;
  totalMembers: number;
  totalActiveMemberships: number;
  totalMonthlyMembershipRevenue: string;
  activeMembersByGym: GymMemberCount[];
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
