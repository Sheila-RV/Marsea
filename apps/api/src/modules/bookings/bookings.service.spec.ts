import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  BookingStatus,
  ClassSessionStatus,
} from '../../generated/prisma/client.js';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: {
    classSession: { findFirst: jest.Mock };
    booking: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let membershipsService: { findActiveForUser: jest.Mock };
  let tx: {
    booking: { findUnique: jest.Mock; count: jest.Mock; upsert: jest.Mock };
  };

  const gymId = 'gym-1';
  const userId = 'user-1';
  const classSessionId = 'session-1';

  const futureSession = {
    id: classSessionId,
    gymId,
    disciplineId: 'discipline-1',
    capacity: 10,
    status: ClassSessionStatus.SCHEDULED,
    startsAt: new Date(Date.now() + 60 * 60 * 1000), // en 1 hora
  };

  const activeMembership = {
    id: 'membership-1',
    planId: 'plan-1',
    planName: 'Plan',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    disciplineIds: ['discipline-1'],
  };

  beforeEach(() => {
    tx = {
      booking: {
        findUnique: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
      },
    };

    prisma = {
      classSession: { findFirst: jest.fn() },
      booking: { findFirst: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
        callback(tx),
      ),
    };

    membershipsService = { findActiveForUser: jest.fn() };

    service = new BookingsService(prisma as never, membershipsService as never);
  });

  describe('create', () => {
    it('lanza NotFoundException si la sesión no existe en el gimnasio', async () => {
      prisma.classSession.findFirst.mockResolvedValue(null);

      await expect(
        service.create(gymId, userId, { classSessionId }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException si la sesión ya empezó', async () => {
      prisma.classSession.findFirst.mockResolvedValue({
        ...futureSession,
        startsAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.create(gymId, userId, { classSessionId }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException si no hay membresía activa que cubra la disciplina', async () => {
      prisma.classSession.findFirst.mockResolvedValue(futureSession);
      membershipsService.findActiveForUser.mockResolvedValue(null);

      await expect(
        service.create(gymId, userId, { classSessionId }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException si la membresía activa no cubre esa disciplina', async () => {
      prisma.classSession.findFirst.mockResolvedValue(futureSession);
      membershipsService.findActiveForUser.mockResolvedValue({
        ...activeMembership,
        disciplineIds: ['otra-disciplina'],
      });

      await expect(
        service.create(gymId, userId, { classSessionId }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException si ya existe una reserva activa para esta sesión', async () => {
      prisma.classSession.findFirst.mockResolvedValue(futureSession);
      membershipsService.findActiveForUser.mockResolvedValue(activeMembership);
      tx.booking.findUnique.mockResolvedValue({ status: BookingStatus.BOOKED });

      await expect(
        service.create(gymId, userId, { classSessionId }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException si la sesión ya está llena', async () => {
      prisma.classSession.findFirst.mockResolvedValue(futureSession);
      membershipsService.findActiveForUser.mockResolvedValue(activeMembership);
      tx.booking.findUnique.mockResolvedValue(null);
      tx.booking.count.mockResolvedValue(futureSession.capacity);

      await expect(
        service.create(gymId, userId, { classSessionId }),
      ).rejects.toThrow(ConflictException);
    });

    it('crea la reserva cuando se cumplen todas las reglas', async () => {
      prisma.classSession.findFirst.mockResolvedValue(futureSession);
      membershipsService.findActiveForUser.mockResolvedValue(activeMembership);
      tx.booking.findUnique.mockResolvedValue(null);
      tx.booking.count.mockResolvedValue(0);
      tx.booking.upsert.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.BOOKED,
      });

      const result = await service.create(gymId, userId, { classSessionId });

      expect(result.status).toBe(BookingStatus.BOOKED);
      expect(tx.booking.upsert).toHaveBeenCalledTimes(1);
    });

    it('reactiva una reserva cancelada en vez de chocar con el único compuesto', async () => {
      prisma.classSession.findFirst.mockResolvedValue(futureSession);
      membershipsService.findActiveForUser.mockResolvedValue(activeMembership);
      tx.booking.findUnique.mockResolvedValue({
        status: BookingStatus.CANCELLED,
      });
      tx.booking.count.mockResolvedValue(0);
      tx.booking.upsert.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.BOOKED,
      });

      await service.create(gymId, userId, { classSessionId });

      const [args] = tx.booking.upsert.mock.calls[0] as [
        { update: { status: string } },
      ];
      expect(args.update.status).toBe(BookingStatus.BOOKED);
    });
  });

  describe('cancel', () => {
    it('lanza ConflictException si la clase ya empezó', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        userId,
        classSession: { startsAt: new Date(Date.now() - 1000) },
      });

      await expect(
        service.cancel(gymId, 'booking-1', { userId, isAdmin: false }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ForbiddenException si un MEMBER intenta cancelar la reserva de otro', async () => {
      prisma.booking.findFirst.mockResolvedValue({
        id: 'booking-1',
        userId: 'otro-usuario',
        classSession: { startsAt: new Date(Date.now() + 60 * 60 * 1000) },
      });

      await expect(
        service.cancel(gymId, 'booking-1', { userId, isAdmin: false }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
