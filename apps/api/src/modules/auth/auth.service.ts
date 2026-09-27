import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { verifyPassword } from '../../common/password.util';
import type { JwtPayload } from './jwt-payload.interface';
import type { UserResponse } from '../users/user-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserResponse> {
    const user = await this.usersService.findByEmailForAuth(email);

    // El mismo mensaje tanto si el email no existe como si la contraseña
    // es incorrecta: no le regalamos a un atacante qué emails están registrados.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await verifyPassword(user.passwordHash, password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      gymId: user.gymId,
      isActive: user.isActive,
    };
  }

  login(user: UserResponse): { accessToken: string } {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      gymId: user.gymId,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }
}
