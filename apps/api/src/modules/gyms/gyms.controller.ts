import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GymsService } from './gyms.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('gyms')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN)
@Controller('gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Post()
  create(@Body() dto: CreateGymDto) {
    return this.gymsService.createWithFirstAdmin(dto);
  }

  @Get()
  findAll() {
    return this.gymsService.findAll();
  }

  // El admin configura su propio nombre y logo; el miembro solo los lee.
  // Va antes de ':id' para que Nest no confunda "me" con un id.
  @Roles(Role.ADMIN, Role.MEMBER)
  @Get('me')
  getMine(@CurrentUser() user: JwtPayload) {
    return this.gymsService.findOne(requireGymId(user));
  }

  @Roles(Role.ADMIN)
  @Patch('me')
  updateMine(@CurrentUser() user: JwtPayload, @Body() dto: UpdateGymDto) {
    return this.gymsService.updateOwnGym(requireGymId(user), dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.gymsService.findOne(id);
  }
}
