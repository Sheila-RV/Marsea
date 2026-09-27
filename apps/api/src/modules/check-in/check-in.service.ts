import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import type { CheckInResult } from './check-in-result.type';
import { BookingStatus } from '../../generated/prisma/client.js';

// Ventana de check-in: se puede marcar asistencia desde 15 minutos antes de
// que empiece la clase, hasta que termine. Fuera de esa ventana, el QR es
// válido pero no hay nada que marcar todavía (o ya pasó).
const CHECK_IN_WINDOW_MINUTES_BEFORE = 15;

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // El flujo real de un gimnasio: el staff escanea el QR personal del
  // miembro con el dispositivo del backoffice; el sistema busca sola la
  // reserva que le corresponde ahora mismo y marca la asistencia.
  async scan(gymId: string, qrCode: string): Promise<CheckInResult> {
    const member = await this.usersService.findByQrCode(gymId, qrCode);

    if (!member) {
      throw new NotFoundException('QR code not recognized in this gym');
    }

    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() + CHECK_IN_WINDOW_MINUTES_BEFORE,
    );
    const now = new Date();

    const booking = await this.prisma.booking.findFirst({
      where: {
        gymId,
        userId: member.id,
        status: BookingStatus.BOOKED,
        classSession: {
          startsAt: { lte: windowStart },
          endsAt: { gte: now },
        },
      },
      orderBy: { classSession: { startsAt: 'asc' } },
      include: { classSession: { include: { discipline: true } } },
    });

    if (!booking) {
      throw new ConflictException(
        `${member.fullName} has no booking to check into right now`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.ATTENDED, checkedInAt: now },
    });

    return {
      bookingId: updated.id,
      memberFullName: member.fullName,
      disciplineName: booking.classSession.discipline.name,
      startsAt: booking.classSession.startsAt,
      checkedInAt: now,
    };
  }
}
