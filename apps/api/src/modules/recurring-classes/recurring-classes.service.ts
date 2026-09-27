import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecurringClassDto } from './dto/create-recurring-class.dto';
import { UpdateRecurringClassDto } from './dto/update-recurring-class.dto';
import type { RecurringClassResponse } from './recurring-class-response.type';
import {
  BookingStatus,
  ClassSessionStatus,
} from '../../generated/prisma/client.js';
import type {
  Discipline,
  RecurringClass,
} from '../../generated/prisma/client.js';

type RecurringClassWithRelations = RecurringClass & {
  discipline: Discipline;
  _count: { generatedSessions: number };
};

interface SessionPattern {
  id: string;
  gymId: string;
  disciplineId: string;
  instructorName: string;
  capacity: number;
  startTime: string;
  durationMinutes: number;
  rangeStart: Date;
  rangeEnd: Date;
  daysOfWeek: number[];
}

@Injectable()
export class RecurringClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    gymId: string,
    dto: CreateRecurringClassDto,
  ): Promise<RecurringClassResponse> {
    await this.assertDisciplineBelongsToGym(gymId, dto.disciplineId);
    this.assertValidRange(dto.rangeStart, dto.rangeEnd);

    const template = await this.prisma.recurringClass.create({
      data: {
        gymId,
        disciplineId: dto.disciplineId,
        instructorName: dto.instructorName,
        capacity: dto.capacity,
        daysOfWeek: dto.daysOfWeek,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes,
        rangeStart: new Date(dto.rangeStart),
        rangeEnd: new Date(dto.rangeEnd),
      },
    });

    await this.generateSessions(template);

    return this.toResponse(await this.findRawOrThrow(gymId, template.id));
  }

  async findAll(gymId: string): Promise<RecurringClassResponse[]> {
    const templates = await this.prisma.recurringClass.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
      include: {
        discipline: true,
        _count: { select: { generatedSessions: true } },
      },
    });

    return templates.map((template) => this.toResponse(template));
  }

  async update(
    gymId: string,
    id: string,
    dto: UpdateRecurringClassDto,
  ): Promise<RecurringClassResponse> {
    const current = await this.findRawOrThrow(gymId, id);

    if (dto.disciplineId) {
      await this.assertDisciplineBelongsToGym(gymId, dto.disciplineId);
    }

    const nextRangeStart = dto.rangeStart
      ? new Date(dto.rangeStart)
      : current.rangeStart;
    const nextRangeEnd = dto.rangeEnd
      ? new Date(dto.rangeEnd)
      : current.rangeEnd;
    this.assertValidRange(nextRangeStart, nextRangeEnd);

    const patternChanged =
      dto.disciplineId !== undefined ||
      dto.daysOfWeek !== undefined ||
      dto.startTime !== undefined ||
      dto.durationMinutes !== undefined ||
      dto.capacity !== undefined ||
      dto.rangeStart !== undefined ||
      dto.rangeEnd !== undefined;

    await this.prisma.recurringClass.update({
      where: { id },
      data: {
        disciplineId: dto.disciplineId,
        instructorName: dto.instructorName,
        capacity: dto.capacity,
        daysOfWeek: dto.daysOfWeek,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes,
        rangeStart: dto.rangeStart ? nextRangeStart : undefined,
        rangeEnd: dto.rangeEnd ? nextRangeEnd : undefined,
        isActive: dto.isActive,
      },
    });

    if (patternChanged) {
      // Solo se tocan las sesiones futuras SIN reservas todavía: las que ya
      // tienen gente inscrita se quedan como estaban, para no romper una
      // reserva confirmada solo porque el patrón cambió después.
      await this.prisma.classSession.deleteMany({
        where: {
          recurringClassId: id,
          startsAt: { gte: new Date() },
          status: ClassSessionStatus.SCHEDULED,
          bookings: { none: {} },
        },
      });

      const refreshed = await this.findRawOrThrow(gymId, id);
      await this.generateSessions(refreshed);
    }

    return this.toResponse(await this.findRawOrThrow(gymId, id));
  }

  async remove(gymId: string, id: string): Promise<void> {
    await this.findRawOrThrow(gymId, id);

    const futureSessions = await this.prisma.classSession.findMany({
      where: {
        recurringClassId: id,
        startsAt: { gte: new Date() },
        status: ClassSessionStatus.SCHEDULED,
      },
      select: { id: true },
    });
    const sessionIds = futureSessions.map((session) => session.id);

    await this.prisma.$transaction([
      this.prisma.recurringClass.update({
        where: { id },
        data: { isActive: false },
      }),
      this.prisma.classSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { status: ClassSessionStatus.CANCELLED },
      }),
      this.prisma.booking.updateMany({
        where: {
          classSessionId: { in: sessionIds },
          status: BookingStatus.BOOKED,
        },
        data: { status: BookingStatus.CANCELLED },
      }),
    ]);
  }

  // Genera las ClassSession concretas para cada fecha del rango que caiga en
  // uno de los días de la semana elegidos, sin duplicar si ya existe una
  // sesión en ese horario exacto (por ejemplo, al reintentar un ajuste).
  private async generateSessions(template: SessionPattern): Promise<void> {
    const [hours, minutes] = template.startTime.split(':').map(Number);

    const candidates = this.datesInRange(
      template.rangeStart,
      template.rangeEnd,
      template.daysOfWeek,
    ).map((date) => {
      const startsAt = new Date(date);
      startsAt.setHours(hours, minutes, 0, 0);
      return {
        startsAt,
        endsAt: new Date(startsAt.getTime() + template.durationMinutes * 60000),
      };
    });

    if (candidates.length === 0) return;

    const existing = await this.prisma.classSession.findMany({
      where: {
        gymId: template.gymId,
        disciplineId: template.disciplineId,
        startsAt: { in: candidates.map((c) => c.startsAt) },
      },
      select: { startsAt: true },
    });
    const existingTimes = new Set(existing.map((e) => e.startsAt.getTime()));
    const toCreate = candidates.filter(
      (c) => !existingTimes.has(c.startsAt.getTime()),
    );

    if (toCreate.length === 0) return;

    await this.prisma.classSession.createMany({
      data: toCreate.map((c) => ({
        gymId: template.gymId,
        disciplineId: template.disciplineId,
        instructorName: template.instructorName,
        capacity: template.capacity,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        recurringClassId: template.id,
      })),
    });
  }

  private datesInRange(start: Date, end: Date, daysOfWeek: number[]): Date[] {
    const dates: Date[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);

    while (cursor.getTime() <= last.getTime()) {
      if (daysOfWeek.includes(cursor.getDay())) {
        dates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }

  private assertValidRange(start: Date | string, end: Date | string): void {
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      throw new BadRequestException('rangeEnd must be after rangeStart');
    }
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

  private async findRawOrThrow(
    gymId: string,
    id: string,
  ): Promise<RecurringClassWithRelations> {
    const template = await this.prisma.recurringClass.findFirst({
      where: { id, gymId },
      include: {
        discipline: true,
        _count: { select: { generatedSessions: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Recurring class ${id} not found`);
    }

    return template;
  }

  private toResponse(
    template: RecurringClassWithRelations,
  ): RecurringClassResponse {
    return {
      id: template.id,
      disciplineId: template.disciplineId,
      disciplineName: template.discipline.name,
      instructorName: template.instructorName,
      capacity: template.capacity,
      daysOfWeek: template.daysOfWeek,
      startTime: template.startTime,
      durationMinutes: template.durationMinutes,
      rangeStart: template.rangeStart,
      rangeEnd: template.rangeEnd,
      isActive: template.isActive,
      generatedSessionsCount: template._count.generatedSessions,
    };
  }
}
