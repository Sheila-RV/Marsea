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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('plans')
@ApiBearerAuth()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePlanDto) {
    return this.plansService.create(requireGymId(user), dto);
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.plansService.findAll(requireGymId(user));
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.plansService.findOne(requireGymId(user), id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(requireGymId(user), id, dto);
  }
}
