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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClassSessionsService } from './class-sessions.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { QueryClassSessionsDto } from './dto/query-class-sessions.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('class-sessions')
@ApiBearerAuth()
@Controller('class-sessions')
export class ClassSessionsController {
  constructor(private readonly classSessionsService: ClassSessionsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateClassSessionDto) {
    return this.classSessionsService.create(requireGymId(user), dto);
  }

  // Debe ir antes que ':id': si no, Nest intentaría interpretar
  // "available" como si fuera un id de sesión.
  @Roles(Role.MEMBER)
  @Get('available')
  findAvailable(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryClassSessionsDto,
  ) {
    return this.classSessionsService.findAvailableForMember(
      requireGymId(user),
      user.sub,
      query,
    );
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryClassSessionsDto,
  ) {
    return this.classSessionsService.findAllForGym(requireGymId(user), query);
  }

  @Roles(Role.ADMIN, Role.MEMBER)
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.classSessionsService.findOne(requireGymId(user), id, user.sub);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassSessionDto,
  ) {
    return this.classSessionsService.update(requireGymId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.classSessionsService.cancel(requireGymId(user), id);
  }
}
