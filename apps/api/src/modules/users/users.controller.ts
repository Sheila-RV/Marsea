import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as QRCode from 'qrcode';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { UserResponse } from './user-response.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

interface QrCodeResponse {
  qrCode: string;
  qrImage: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.create(requireGymId(user), dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<UserResponse[]> {
    return this.usersService.findAllByGym(requireGymId(user));
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload): Promise<UserResponse> {
    return this.usersService.getOwnProfile(user.sub);
  }

  @Roles(Role.MEMBER)
  @Get('me/qr-code')
  async getMyQrCode(@CurrentUser() user: JwtPayload): Promise<QrCodeResponse> {
    const gymId = requireGymId(user);
    const { qrCode } = await this.usersService.getQrCode(gymId, user.sub);
    return this.buildQrResponse(qrCode);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponse> {
    return this.usersService.findOne(requireGymId(user), id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.update(requireGymId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Get(':id/qr-code')
  async getQrCode(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QrCodeResponse> {
    const gymId = requireGymId(user);
    const { qrCode } = await this.usersService.getQrCode(gymId, id);
    return this.buildQrResponse(qrCode);
  }

  @Roles(Role.ADMIN)
  @Post(':id/qr-code/regenerate')
  async regenerateQrCode(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QrCodeResponse> {
    const gymId = requireGymId(user);
    const { qrCode } = await this.usersService.regenerateQrCode(gymId, id);
    return this.buildQrResponse(qrCode);
  }

  // Genera la imagen PNG (como data URL) a partir del token de texto,
  // para que el frontend la muestre con un simple <img src="...">.
  private async buildQrResponse(qrCode: string): Promise<QrCodeResponse> {
    const qrImage = await QRCode.toDataURL(qrCode);
    return { qrCode, qrImage };
  }
}
