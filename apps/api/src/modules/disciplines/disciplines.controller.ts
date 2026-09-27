import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DisciplinesService } from './disciplines.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import type { Discipline } from '../../generated/prisma/client.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('disciplines')
@ApiBearerAuth()
@Controller('disciplines')
export class DisciplinesController {
  constructor(private readonly disciplinesService: DisciplinesService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDisciplineDto,
  ): Promise<Discipline> {
    return this.disciplinesService.create(requireGymId(user), dto);
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<Discipline[]> {
    return this.disciplinesService.findAll(requireGymId(user));
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Discipline> {
    return this.disciplinesService.findOne(requireGymId(user), id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisciplineDto,
  ): Promise<Discipline> {
    return this.disciplinesService.update(requireGymId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.disciplinesService.remove(requireGymId(user), id);
  }
}
