import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminDashboard,
  BookingsPerDay,
  MembershipsByPlan,
  RecentBooking,
} from './admin-dashboard.type';
import type {
  GymMemberCount,
  SuperAdminDashboard,
} from './super-admin-dashboard.type';
import {
  BookingStatus,
  ClassSessionStatus,
  Role,
} from '../../generated/prisma/client.js';

const BOOKINGS_TREND_DAYS = 14;
const BOOKING_STATS_WINDOW_DAYS = 30;
const RECENT_BOOKINGS_LIMIT = 8;

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// null cuando el período anterior no tiene datos: dividir por cero no dice
// nada útil ("infinito por ciento" no es una métrica), así que el frontend
// simplemente no muestra la insignia de variación en ese caso.
function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Arma una serie de N días consecutivos hasta hoy, con 0 donde no hubo
// reservas, para que el gráfico no tenga huecos entre fechas.
function buildDailySeries(
  bookedDates: Date[],
  numberOfDays: number,
): BookingsPerDay[] {
  const counts = new Map<string, number>();
  for (const date of bookedDates) {
    const key = toDateKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: BookingsPerDay[] = [];
  for (let i = numberOfDays - 1; i >= 0; i -= 1) {
    const date = daysAgo(i);
    const key = toDateKey(date);
    series.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return series;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard(gymId: string): Promise<AdminDashboard> {
    const now = new Date();
    const statsWindowStart = daysAgo(BOOKING_STATS_WINDOW_DAYS);
    const previousWindowStart = daysAgo(BOOKING_STATS_WINDOW_DAYS * 2);
    const trendWindowStart = daysAgo(BOOKINGS_TREND_DAYS - 1);

    const [
      totalMembers,
      membersLast30d,
      membersPrev30d,
      activeMemberships,
      upcomingClassSessions,
      totalBookings,
      bookingsPrev30d,
      confirmedBookings,
      cancelledBookings,
      pendingBookings,
      activeMembershipsWithPlan,
      recentBookingRows,
      recentBookingsForTrend,
    ] = await Promise.all([
      this.prisma.user.count({ where: { gymId, role: Role.MEMBER } }),
      this.prisma.user.count({
        where: {
          gymId,
          role: Role.MEMBER,
          createdAt: { gte: statsWindowStart },
        },
      }),
      this.prisma.user.count({
        where: {
          gymId,
          role: Role.MEMBER,
          createdAt: { gte: previousWindowStart, lt: statsWindowStart },
        },
      }),
      this.prisma.membership.count({
        where: { gymId, status: 'ACTIVE', endDate: { gte: now } },
      }),
      this.prisma.classSession.count({
        where: {
          gymId,
          status: ClassSessionStatus.SCHEDULED,
          startsAt: { gte: now },
        },
      }),
      this.prisma.booking.count({
        where: { gymId, bookedAt: { gte: statsWindowStart } },
      }),
      this.prisma.booking.count({
        where: {
          gymId,
          bookedAt: { gte: previousWindowStart, lt: statsWindowStart },
        },
      }),
      this.prisma.booking.count({
        where: {
          gymId,
          status: BookingStatus.ATTENDED,
          bookedAt: { gte: statsWindowStart },
        },
      }),
      this.prisma.booking.count({
        where: {
          gymId,
          status: BookingStatus.CANCELLED,
          bookedAt: { gte: statsWindowStart },
        },
      }),
      this.prisma.booking.count({
        where: {
          gymId,
          status: BookingStatus.BOOKED,
          classSession: { startsAt: { gte: now } },
        },
      }),
      this.prisma.membership.findMany({
        where: { gymId, status: 'ACTIVE', endDate: { gte: now } },
        select: {
          plan: { select: { id: true, name: true, price: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: { gymId },
        orderBy: { bookedAt: 'desc' },
        take: RECENT_BOOKINGS_LIMIT,
        select: {
          id: true,
          status: true,
          bookedAt: true,
          user: { select: { fullName: true } },
          classSession: {
            select: {
              startsAt: true,
              discipline: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.booking.findMany({
        where: { gymId, bookedAt: { gte: trendWindowStart } },
        select: { bookedAt: true },
      }),
    ]);

    const monthlyMembershipRevenue = activeMembershipsWithPlan
      .reduce((sum, m) => sum + Number(m.plan.price), 0)
      .toFixed(2);

    const membershipsByPlanMap = new Map<string, MembershipsByPlan>();
    for (const membership of activeMembershipsWithPlan) {
      const existing = membershipsByPlanMap.get(membership.plan.id);
      if (existing) {
        existing.count += 1;
      } else {
        membershipsByPlanMap.set(membership.plan.id, {
          planId: membership.plan.id,
          planName: membership.plan.name,
          count: 1,
        });
      }
    }

    const recentBookings: RecentBooking[] = recentBookingRows.map((b) => ({
      id: b.id,
      memberFullName: b.user.fullName,
      disciplineName: b.classSession.discipline.name,
      classStartsAt: b.classSession.startsAt.toISOString(),
      status: b.status,
      bookedAt: b.bookedAt.toISOString(),
    }));

    return {
      totalMembers,
      membersDeltaPct: deltaPct(membersLast30d, membersPrev30d),
      activeMemberships,
      upcomingClassSessions,
      bookings30d: {
        total: totalBookings,
        deltaPct: deltaPct(totalBookings, bookingsPrev30d),
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        pending: pendingBookings,
      },
      monthlyMembershipRevenue,
      bookingsPerDay: buildDailySeries(
        recentBookingsForTrend.map((b) => b.bookedAt),
        BOOKINGS_TREND_DAYS,
      ),
      membershipsByPlan: [...membershipsByPlanMap.values()],
      recentBookings,
    };
  }

  async getSuperAdminDashboard(): Promise<SuperAdminDashboard> {
    const now = new Date();

    const [gyms, totalMembers, activeMembershipsWithPlan] = await Promise.all([
      this.prisma.gym.findMany({
        select: {
          id: true,
          name: true,
          isActive: true,
          users: {
            where: { role: Role.MEMBER },
            select: { id: true },
          },
        },
      }),
      this.prisma.user.count({ where: { role: Role.MEMBER } }),
      this.prisma.membership.findMany({
        where: { status: 'ACTIVE', endDate: { gte: now } },
        select: { gymId: true, plan: { select: { price: true } } },
      }),
    ]);

    const activeMembershipsByGym = new Map<string, number>();
    let totalRevenue = 0;
    for (const membership of activeMembershipsWithPlan) {
      totalRevenue += Number(membership.plan.price);
      activeMembershipsByGym.set(
        membership.gymId,
        (activeMembershipsByGym.get(membership.gymId) ?? 0) + 1,
      );
    }

    const activeMembersByGym: GymMemberCount[] = gyms.map((gym) => ({
      gymId: gym.id,
      gymName: gym.name,
      activeMembers: activeMembershipsByGym.get(gym.id) ?? 0,
    }));

    return {
      totalGyms: gyms.length,
      activeGyms: gyms.filter((g) => g.isActive).length,
      totalMembers,
      totalActiveMemberships: activeMembershipsWithPlan.length,
      totalMonthlyMembershipRevenue: totalRevenue.toFixed(2),
      activeMembersByGym,
    };
  }
}
