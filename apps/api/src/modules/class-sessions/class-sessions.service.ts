import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipsService } from '../memberships/memberships.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { QueryClassSessionsDto } from './dto/query-class-sessions.dto';
import type { ClassSessionResponse } from './class-session-response.type';
import {
  BookingStatus,
  ClassSessionStatus,
} from '../../generated/prisma/client.js';
import type {
  ClassSession,
  Discipline,
  Booking,
} from '../../generated/prisma/client.js';
import { ACTIVE_BOOKING_STATUSES } from '../../common/active-booking-statuses.const';

type ClassSessionWithRelations = ClassSession & {
  discipline: Discipline;
  bookings: Booking[];
};

@Injectable()
export class ClassSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async create(
    gymId: string,
    dto: CreateClassSessionDto,
  ): Promise<ClassSessionResponse> {
    await this.assertDisciplineBelongsToGym(gymId, dto.disciplineId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const session = await this.prisma.classSession.create({
      data: {
        gymId,
        disciplineId: dto.disciplineId,
        instructorName: dto.instructorName,
        startsAt,
        endsAt,
        capacity: dto.capacity,
      },
      include: { discipline: true, bookings: true },
    });

    return this.toResponse(session, undefined);
  }

  async findAllForGym(
    gymId: string,
    query: QueryClassSessionsDto,
  ): Promise<ClassSessionResponse[]> {
    const sessions = await this.prisma.classSession.findMany({
      where: {
        gymId,
        disciplineId: query.disciplineId,
        startsAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { startsAt: 'asc' },
      include: { discipline: true, bookings: true },
    });

    return sessions.map((session) => this.toResponse(session, undefined));
  }

  // La regla central del proyecto: un miembro solo ve sesiones cuya
  // disciplina cubre su plan activo. Sin membresía activa, no ve nada.
  async findAvailableForMember(
    gymId: string,
    userId: string,
    query: QueryClassSessionsDto,
  ): Promise<ClassSessionResponse[]> {
    const activeMembership = await this.membershipsService.findActiveForUser(
      gymId,
      userId,
    );

    if (!activeMembership || activeMembership.disciplineIds.length === 0) {
      return [];
    }

    // Si además filtran por una disciplina puntual, intersecamos con las que
    // el plan realmente cubre: pedir una fuera del plan da lista vacía, no error.
    const disciplineIds = query.disciplineId
      ? activeMembership.disciplineIds.filter((id) => id === query.disciplineId)
      : activeMembership.disciplineIds;

    if (disciplineIds.length === 0) {
      return [];
    }

    const sessions = await this.prisma.classSession.findMany({
      where: {
        gymId,
        status: ClassSessionStatus.SCHEDULED,
        disciplineId: { in: disciplineIds },
        startsAt: {
          gte: query.from ? new Date(query.from) : new Date(),
          lte: query.to ? new Date(query.to) : undefined,
        },
      },
      orderBy: { startsAt: 'asc' },
      include: { discipline: true, bookings: true },
    });

    return sessions.map((session) => this.toResponse(session, userId));
  }

  async findOne(
    gymId: string,
    id: string,
    userId?: string,
  ): Promise<ClassSessionResponse> {
    const session = await this.prisma.classSession.findFirst({
      where: { id, gymId },
      include: { discipline: true, bookings: true },
    });

    if (!session) {
      throw new NotFoundException(`Class session ${id} not found`);
    }

    return this.toResponse(session, userId);
  }

  async update(
    gymId: string,
    id: string,
    dto: UpdateClassSessionDto,
  ): Promise<ClassSessionResponse> {
    await this.findRawOrThrow(gymId, id);

    if (dto.disciplineId) {
      await this.assertDisciplineBelongsToGym(gymId, dto.disciplineId);
    }

    const session = await this.prisma.classSession.update({
      where: { id },
      data: {
        disciplineId: dto.disciplineId,
        instructorName: dto.instructorName,
        capacity: dto.capacity,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: { discipline: true, bookings: true },
    });

    return this.toResponse(session, undefined);
  }

  // No borra la fila: cancela la sesión y, en cascada de negocio (no de FK),
  // cancela también las reservas activas. Así se conserva el historial y las
  // reservas no quedan huérfanas apuntando a una sesión que "desapareció".
  async cancel(gymId: string, id: string): Promise<void> {
    await this.findRawOrThrow(gymId, id);

    await this.prisma.$transaction([
      this.prisma.classSession.update({
        where: { id },
        data: { status: ClassSessionStatus.CANCELLED },
      }),
      this.prisma.booking.updateMany({
        where: { classSessionId: id, status: BookingStatus.BOOKED },
        data: { status: BookingStatus.CANCELLED },
      }),
    ]);
  }

  private async findRawOrThrow(
    gymId: string,
    id: string,
  ): Promise<ClassSession> {
    const session = await this.prisma.classSession.findFirst({
      where: { id, gymId },
    });

    if (!session) {
      throw new NotFoundException(`Class session ${id} not found`);
    }

    return session;
  }

  private async assertDisciplineBelongsToGym(
    gymId: string,
    disciplineId: string,
  ): Promise<void> {
    const discipline = await this.prisma.discipline.findFirst({
      where: { id: disciplineId, gymId },
    });

    if (!discipline) {
      throw new BadRequestException('Discipline does not belong to this gym');
    }
  }

  private toResponse(
    session: ClassSessionWithRelations,
    currentUserId: string | undefined,
  ): ClassSessionResponse {
    const activeBookings = session.bookings.filter((booking) =>
      ACTIVE_BOOKING_STATUSES.includes(booking.status),
    );

    const myBooking = currentUserId
      ? (activeBookings.find((booking) => booking.userId === currentUserId) ??
        null)
      : null;

    return {
      id: session.id,
      disciplineId: session.disciplineId,
      disciplineName: session.discipline.name,
      instructorName: session.instructorName,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      capacity: session.capacity,
      status: session.status,
      bookedCount: activeBookings.length,
      remainingCapacity: session.capacity - activeBookings.length,
      isBookedByMe: myBooking !== null,
      myBookingId: myBooking?.id ?? null,
    };
  }
}
