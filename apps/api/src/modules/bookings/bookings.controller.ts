import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles(Role.MEMBER)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(requireGymId(user), user.sub, dto);
  }

  @Roles(Role.MEMBER)
  @Get('me')
  findMine(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.findMine(requireGymId(user), user.sub);
  }

  @Roles(Role.ADMIN)
  @Get()
  findForSession(
    @CurrentUser() user: JwtPayload,
    @Query('classSessionId', ParseUUIDPipe) classSessionId: string,
  ) {
    return this.bookingsService.findForSession(
      requireGymId(user),
      classSessionId,
    );
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Patch(':id/cancel')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.cancel(requireGymId(user), id, {
      userId: user.sub,
      isAdmin: user.role === Role.ADMIN,
    });
  }

  @Roles(Role.ADMIN)
  @Patch(':id/check-in')
  checkIn(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.markAttended(requireGymId(user), id);
  }
}
