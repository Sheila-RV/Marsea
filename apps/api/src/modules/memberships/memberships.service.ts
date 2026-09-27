import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import type { ActiveMembership } from './active-membership.type';
import { Role } from '../../generated/prisma/client.js';
import type { Membership } from '../../generated/prisma/client.js';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreateMembershipDto): Promise<Membership> {
    const member = await this.prisma.user.findFirst({
      where: { id: dto.userId, gymId, role: Role.MEMBER },
    });

    if (!member) {
      throw new BadRequestException('User is not a member of this gym');
    }

    const plan = await this.prisma.plan.findFirst({
      where: { id: dto.planId, gymId, isActive: true },
    });

    if (!plan) {
      throw new BadRequestException(
        'Plan does not exist or is not active in this gym',
      );
    }

    const existingActive = await this.findActiveForUser(gymId, dto.userId);

    if (existingActive) {
      throw new ConflictException('This user already has an active membership');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.prisma.membership.create({
      data: {
        gymId,
        userId: dto.userId,
        planId: dto.planId,
        startDate,
        endDate,
      },
    });
  }

  async findAllByGym(gymId: string, userId?: string): Promise<Membership[]> {
    return this.prisma.membership.findMany({
      where: { gymId, userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async cancel(gymId: string, id: string): Promise<Membership> {
    const membership = await this.prisma.membership.findFirst({
      where: { id, gymId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership ${id} not found`);
    }

    return this.prisma.membership.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // La regla central del proyecto: qué disciplinas cubre el plan de la
  // membresía activa de este usuario, ahora mismo. Null si no tiene ninguna.
  // "Activa" se calcula en la propia consulta (status ACTIVE y endDate en el
  // futuro), sin necesidad de un job que actualice estados.
  async findActiveForUser(
    gymId: string,
    userId: string,
  ): Promise<ActiveMembership | null> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        gymId,
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'desc' },
      include: { plan: { include: { disciplines: true } } },
    });

    if (!membership) {
      return null;
    }

    return {
      id: membership.id,
      planId: membership.planId,
      planName: membership.plan.name,
      startDate: membership.startDate,
      endDate: membership.endDate,
      disciplineIds: membership.plan.disciplines.map((pd) => pd.disciplineId),
    };
  }
}
