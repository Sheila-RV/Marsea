export interface BookingsPerDay {
  date: string; // 'YYYY-MM-DD'
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
  status: string;
  bookedAt: string;
}

export interface AdminDashboard {
  totalMembers: number;
  membersDeltaPct: number | null; // vs los 30 días anteriores, null si no hay base para comparar
  activeMemberships: number;
  upcomingClassSessions: number;
  bookings30d: {
    total: number;
    deltaPct: number | null;
    confirmed: number; // ATTENDED
    cancelled: number; // CANCELLED
    pending: number; // BOOKED, sesión todavía no empieza
  };
  monthlyMembershipRevenue: string; // suma de plan.price de membresías activas
  bookingsPerDay: BookingsPerDay[]; // últimos 14 días
  membershipsByPlan: MembershipsByPlan[];
  recentBookings: RecentBooking[];
}
