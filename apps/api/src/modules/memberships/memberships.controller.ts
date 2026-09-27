import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('memberships')
@ApiBearerAuth()
@Controller()
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Roles(Role.ADMIN)
  @Post('memberships')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(requireGymId(user), dto);
  }

  @Roles(Role.ADMIN)
  @Get('memberships')
  findAll(@CurrentUser() user: JwtPayload, @Query('userId') userId?: string) {
    return this.membershipsService.findAllByGym(requireGymId(user), userId);
  }

  @Roles(Role.ADMIN)
  @Patch('memberships/:id/cancel')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membershipsService.cancel(requireGymId(user), id);
  }

  @Roles(Role.MEMBER)
  @Get('me/membership')
  async findMine(@CurrentUser() user: JwtPayload) {
    const active = await this.membershipsService.findActiveForUser(
      requireGymId(user),
      user.sub,
    );

    if (!active) {
      throw new NotFoundException('No active membership');
    }

    return active;
  }
}
