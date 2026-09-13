import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Discipline } from '../../generated/prisma/client.js';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
@Injectable()
export class DisciplinesService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(gymId: string): Promise<Discipline[]> {
    return this.prisma.discipline.findMany({
      where: { gymId },
      orderBy: { name: 'asc' },
    });
  }
  async findOne(gymId: string, id: string): Promise<Discipline> {
    const discipline = await this.prisma.discipline.findFirst({
      where: { id, gymId },
    });
    if (!discipline) {
      throw new NotFoundException(`Discipline ${id} not found`);
    }

    return discipline;
  }
  async create(gymId: string, dto: CreateDisciplineDto): Promise<Discipline> {
    await this.assertNameIsAvailable(gymId, dto.name);

    return this.prisma.discipline.create({
      data: { ...dto, gymId },
    });
  }

  private async assertNameIsAvailable(
    gymId: string,
    name: string,
  ): Promise<void> {
    const existing = await this.prisma.discipline.findFirst({
      where: { gymId, name },
    });

    if (existing) {
      throw new ConflictException(`Discipline "${name}" already exists`);
    }
  }

  async update(
    gymId: string,
    id: string,
    dto: UpdateDisciplineDto,
  ): Promise<Discipline> {
    await this.findOne(gymId, id);
    return this.prisma.discipline.update({
      where: { id },
      data: dto,
    });
  }
  async remove(gymId: string, id: string): Promise<void> {
    await this.findOne(gymId, id);
    await this.prisma.discipline.delete({
      where: { id },
    });
  }
}
