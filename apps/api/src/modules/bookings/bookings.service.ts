import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import type { BookingResponse } from './booking-response.type';
import { ACTIVE_BOOKING_STATUSES } from '../../common/active-booking-statuses.const';
import {
  BookingStatus,
  ClassSessionStatus,
} from '../../generated/prisma/client.js';
import type { Booking } from '../../generated/prisma/client.js';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async create(
    gymId: string,
    userId: string,
    dto: CreateBookingDto,
  ): Promise<Booking> {
    const session = await this.prisma.classSession.findFirst({
      where: { id: dto.classSessionId, gymId },
    });

    if (!session) {
      throw new NotFoundException(
        `Class session ${dto.classSessionId} not found`,
      );
    }

    if (
      session.status !== ClassSessionStatus.SCHEDULED ||
      session.startsAt <= new Date()
    ) {
      throw new ConflictException('This class session cannot be booked');
    }

    const activeMembership = await this.membershipsService.findActiveForUser(
      gymId,
      userId,
    );

    if (
      !activeMembership ||
      !activeMembership.disciplineIds.includes(session.disciplineId)
    ) {
      throw new ConflictException(
        'Your active membership does not cover this discipline',
      );
    }

    // Todo el chequeo de cupo + la escritura van en una sola transacción para
    // reducir (no eliminar del todo, ver L04) la ventana de carrera entre dos
    // reservas simultáneas para el último cupo disponible.
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: {
          userId_classSessionId: { userId, classSessionId: dto.classSessionId },
        },
      });

      if (existing && ACTIVE_BOOKING_STATUSES.includes(existing.status)) {
        throw new ConflictException('You already booked this class session');
      }

      const activeCount = await tx.booking.count({
        where: {
          classSessionId: dto.classSessionId,
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
        },
      });

      if (activeCount >= session.capacity) {
        throw new ConflictException('This class session is full');
      }

      // upsert en vez de create: si el miembro había cancelado antes una
      // reserva para esta misma sesión, la reactivamos en vez de chocar
      // contra el único compuesto (userId, classSessionId).
      return tx.booking.upsert({
        where: {
          userId_classSessionId: { userId, classSessionId: dto.classSessionId },
        },
        update: {
          status: BookingStatus.BOOKED,
          bookedAt: new Date(),
          checkedInAt: null,
        },
        create: {
          gymId,
          userId,
          classSessionId: dto.classSessionId,
          status: BookingStatus.BOOKED,
        },
      });
    });
  }

  async findMine(gymId: string, userId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { gymId, userId },
      orderBy: { bookedAt: 'desc' },
      include: { classSession: { include: { discipline: true } } },
    });
  }

  async findForSession(
    gymId: string,
    classSessionId: string,
  ): Promise<BookingResponse[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { gymId, classSessionId },
      orderBy: { bookedAt: 'asc' },
      include: { user: { select: { fullName: true } } },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      bookedAt: booking.bookedAt,
      checkedInAt: booking.checkedInAt,
      classSessionId: booking.classSessionId,
      userId: booking.userId,
      userFullName: booking.user.fullName,
    }));
  }

  // MEMBER solo puede cancelar la suya; ADMIN puede cancelar cualquiera del
  // gimnasio (por ejemplo, si el miembro llama para avisar que no vendrá).
  async cancel(
    gymId: string,
    id: string,
    caller: { userId: string; isAdmin: boolean },
  ): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, gymId },
      include: { classSession: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    if (!caller.isAdmin && booking.userId !== caller.userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.classSession.startsAt <= new Date()) {
      throw new ConflictException(
        'Cannot cancel a booking after the class has started',
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  // Check-in manual desde el backoffice, sin pasar por QR (ver CheckInModule).
  async markAttended(gymId: string, id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, gymId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    if (booking.status !== BookingStatus.BOOKED) {
      throw new ConflictException(
        'Only a booked reservation can be marked as attended',
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.ATTENDED, checkedInAt: new Date() },
    });
  }
}
