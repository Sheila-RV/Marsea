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
import { RecurringClassesService } from './recurring-classes.service';
import { CreateRecurringClassDto } from './dto/create-recurring-class.dto';
import { UpdateRecurringClassDto } from './dto/update-recurring-class.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('recurring-classes')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('recurring-classes')
export class RecurringClassesController {
  constructor(
    private readonly recurringClassesService: RecurringClassesService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecurringClassDto,
  ) {
    return this.recurringClassesService.create(requireGymId(user), dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.recurringClassesService.findAll(requireGymId(user));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringClassDto,
  ) {
    return this.recurringClassesService.update(requireGymId(user), id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recurringClassesService.remove(requireGymId(user), id);
  }
}
