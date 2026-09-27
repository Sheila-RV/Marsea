import { ConflictException, NotFoundException } from '@nestjs/common';
import { DisciplinesService } from './disciplines.service';

describe('DisciplinesService', () => {
  let service: DisciplinesService;
  let prisma: {
    discipline: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const gymId = 'gym-1';

  beforeEach(() => {
    prisma = {
      discipline: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new DisciplinesService(prisma as never);
  });

  it('findOne lanza NotFoundException si no existe en este gimnasio', async () => {
    prisma.discipline.findFirst.mockResolvedValue(null);

    await expect(service.findOne(gymId, 'id-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('create lanza ConflictException si el nombre ya existe en el gimnasio', async () => {
    prisma.discipline.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(service.create(gymId, { name: 'Yoga' })).rejects.toThrow(
      ConflictException,
    );

    expect(prisma.discipline.create).not.toHaveBeenCalled();
  });

  it('create llama a prisma.discipline.create con el gymId incluido', async () => {
    prisma.discipline.findFirst.mockResolvedValue(null);
    prisma.discipline.create.mockResolvedValue({
      id: 'new-id',
      name: 'Yoga',
      gymId,
    });

    await service.create(gymId, { name: 'Yoga' });

    expect(prisma.discipline.create).toHaveBeenCalledWith({
      data: { name: 'Yoga', gymId },
    });
  });

  it('update no repite el chequeo de nombre si el nombre no cambia', async () => {
    prisma.discipline.findFirst.mockResolvedValue({
      id: 'id-1',
      gymId,
      name: 'Yoga',
    });
    prisma.discipline.update.mockResolvedValue({ id: 'id-1', name: 'Yoga' });

    await service.update(gymId, 'id-1', { description: 'nueva descripción' });

    // Solo la llamada de findOne, ninguna adicional para revisar duplicados.
    expect(prisma.discipline.findFirst).toHaveBeenCalledTimes(1);
  });
});
