import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import type { PlanResponse } from './plan-response.type';
import { Prisma } from '../../generated/prisma/client.js';
import type {
  Plan,
  PlanDiscipline,
  Discipline,
} from '../../generated/prisma/client.js';

type PlanWithDisciplines = Plan & {
  disciplines: Array<PlanDiscipline & { discipline: Discipline }>;
};

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(gymId: string, dto: CreatePlanDto): Promise<PlanResponse> {
    await this.assertNameIsAvailable(gymId, dto.name);
    await this.assertDisciplinesBelongToGym(gymId, dto.disciplineIds);

    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        price: new Prisma.Decimal(dto.price),
        durationDays: dto.durationDays,
        gymId,
        disciplines: {
          create: dto.disciplineIds.map((disciplineId) => ({ disciplineId })),
        },
      },
      include: { disciplines: { include: { discipline: true } } },
    });

    return this.toResponse(plan);
  }

  async findAll(gymId: string): Promise<PlanResponse[]> {
    const plans = await this.prisma.plan.findMany({
      where: { gymId },
      orderBy: { name: 'asc' },
      include: { disciplines: { include: { discipline: true } } },
    });

    return plans.map((plan) => this.toResponse(plan));
  }

  async findOne(gymId: string, id: string): Promise<PlanResponse> {
    const plan = await this.prisma.plan.findFirst({
      where: { id, gymId },
      include: { disciplines: { include: { discipline: true } } },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found`);
    }

    return this.toResponse(plan);
  }

  async update(
    gymId: string,
    id: string,
    dto: UpdatePlanDto,
  ): Promise<PlanResponse> {
    const current = await this.prisma.plan.findFirst({ where: { id, gymId } });

    if (!current) {
      throw new NotFoundException(`Plan ${id} not found`);
    }

    if (dto.name && dto.name !== current.name) {
      await this.assertNameIsAvailable(gymId, dto.name);
    }

    if (dto.disciplineIds) {
      await this.assertDisciplinesBelongToGym(gymId, dto.disciplineIds);
    }

    // Reemplazar el set de disciplinas es borrar y recrear las filas de la
    // tabla intermedia, todo dentro de una transacción para no dejar el
    // plan a medio actualizar si algo falla.
    const plan = await this.prisma.$transaction(async (tx) => {
      if (dto.disciplineIds) {
        await tx.planDiscipline.deleteMany({ where: { planId: id } });
      }

      return tx.plan.update({
        where: { id },
        data: {
          name: dto.name,
          durationDays: dto.durationDays,
          isActive: dto.isActive,
          price:
            dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
          disciplines: dto.disciplineIds
            ? {
                create: dto.disciplineIds.map((disciplineId) => ({
                  disciplineId,
                })),
              }
            : undefined,
        },
        include: { disciplines: { include: { discipline: true } } },
      });
    });

    return this.toResponse(plan);
  }

  private async assertNameIsAvailable(
    gymId: string,
    name: string,
  ): Promise<void> {
    const existing = await this.prisma.plan.findFirst({
      where: { gymId, name },
    });

    if (existing) {
      throw new ConflictException(`Plan "${name}" already exists`);
    }
  }

  private async assertDisciplinesBelongToGym(
    gymId: string,
    disciplineIds: string[],
  ): Promise<void> {
    const count = await this.prisma.discipline.count({
      where: { id: { in: disciplineIds }, gymId },
    });

    if (count !== disciplineIds.length) {
      throw new BadRequestException(
        'One or more disciplines do not belong to this gym',
      );
    }
  }

  private toResponse(plan: PlanWithDisciplines): PlanResponse {
    return {
      id: plan.id,
      name: plan.name,
      price: plan.price.toString(),
      durationDays: plan.durationDays,
      isActive: plan.isActive,
      gymId: plan.gymId,
      disciplines: plan.disciplines.map((planDiscipline) => ({
        id: planDiscipline.discipline.id,
        name: planDiscipline.discipline.name,
      })),
    };
  }
}
