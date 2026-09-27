import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../common/password.util';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { USER_SELECT_FIELDS } from '../users/user-select.const';
import type { UserResponse } from '../users/user-response.type';
import { Role } from '../../generated/prisma/client.js';
import type { Gym } from '../../generated/prisma/client.js';

export interface GymWithFirstAdmin {
  gym: Gym;
  admin: UserResponse;
}

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  async createWithFirstAdmin(dto: CreateGymDto): Promise<GymWithFirstAdmin> {
    await this.assertSlugIsAvailable(dto.slug);
    await this.assertEmailIsAvailable(dto.adminEmail);

    const passwordHash = await hashPassword(dto.adminPassword);
    const qrCode = `qr_${randomUUID()}`;

    // Las dos escrituras se aplican juntas o ninguna: si crear el admin
    // fallara, el gimnasio tampoco quedaría creado (ver L07).
    const [gym, admin] = await this.prisma.$transaction(async (tx) => {
      const createdGym = await tx.gym.create({
        data: { name: dto.name, slug: dto.slug },
      });

      const createdAdmin = await tx.user.create({
        data: {
          email: dto.adminEmail,
          passwordHash,
          fullName: dto.adminFullName,
          role: Role.ADMIN,
          gymId: createdGym.id,
          qrCode,
        },
        select: USER_SELECT_FIELDS,
      });

      return [createdGym, createdAdmin] as const;
    });

    return { gym, admin };
  }

  async findAll(): Promise<Gym[]> {
    return this.prisma.gym.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<Gym> {
    const gym = await this.prisma.gym.findUnique({ where: { id } });

    if (!gym) {
      throw new NotFoundException(`Gym ${id} not found`);
    }

    return gym;
  }

  async updateOwnGym(gymId: string, dto: UpdateGymDto): Promise<Gym> {
    await this.findOne(gymId);

    return this.prisma.gym.update({
      where: { id: gymId },
      data: dto,
    });
  }

  private async assertSlugIsAvailable(slug: string): Promise<void> {
    const existing = await this.prisma.gym.findUnique({ where: { slug } });

    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already taken`);
    }
  }

  private async assertEmailIsAvailable(email: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException(`Email "${email}" is already registered`);
    }
  }
}
