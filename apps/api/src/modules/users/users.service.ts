import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../common/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UserResponse } from './user-response.type';
import { USER_SELECT_FIELDS } from './user-select.const';
import { Role } from '../../generated/prisma/client.js';
import type { User } from '../../generated/prisma/client.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = USER_SELECT_FIELDS;

  async create(gymId: string, dto: CreateUserDto): Promise<UserResponse> {
    await this.assertEmailIsAvailable(dto.email);

    const passwordHash = await hashPassword(dto.password);
    const qrCode = this.generateQrCode();

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: Role.MEMBER,
        gymId,
        qrCode,
      },
      select: this.userSelect,
    });
  }

  async findAllByGym(gymId: string): Promise<UserResponse[]> {
    return this.prisma.user.findMany({
      where: { gymId },
      orderBy: { fullName: 'asc' },
      select: this.userSelect,
    });
  }

  async findOne(gymId: string, id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, gymId },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async getOwnProfile(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    gymId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponse> {
    await this.findOne(gymId, id);

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: this.userSelect,
    });
  }

  async getQrCode(gymId: string, id: string): Promise<{ qrCode: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id, gymId },
      select: { qrCode: true },
    });

    if (!user?.qrCode) {
      throw new NotFoundException('No QR code available for this user');
    }

    return { qrCode: user.qrCode };
  }

  async regenerateQrCode(
    gymId: string,
    id: string,
  ): Promise<{ qrCode: string }> {
    await this.findOne(gymId, id);

    const qrCode = this.generateQrCode();
    await this.prisma.user.update({ where: { id }, data: { qrCode } });

    return { qrCode };
  }

  // Usado solo por AuthService para verificar credenciales. Trae el hash
  // a propósito: nunca se expone por HTTP porque no pasa por userSelect.
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Usado por CheckInService al escanear el QR de un miembro. Se exige el
  // mismo gimnasio del staff que escanea: el QR de un miembro de otro
  // gimnasio no resuelve a nadie aquí, aunque el código sea válido en general.
  async findByQrCode(
    gymId: string,
    qrCode: string,
  ): Promise<UserResponse | null> {
    const user = await this.prisma.user.findFirst({
      where: { qrCode, gymId, role: Role.MEMBER, isActive: true },
      select: this.userSelect,
    });

    return user;
  }

  private async assertEmailIsAvailable(email: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException(`Email "${email}" is already registered`);
    }
  }

  private generateQrCode(): string {
    return `qr_${randomUUID()}`;
  }
}
