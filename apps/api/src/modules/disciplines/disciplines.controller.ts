import { Controller } from '@nestjs/common';
import { Discipline } from '../../generated/prisma/client';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { DisciplinesService } from './disciplines.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';

@Controller('gyms/:gymId/disciplines')
export class DisciplinesController {
  constructor(private readonly disciplinesService: DisciplinesService) {}

  @Post()
  create(
    @Param('gymId', ParseUUIDPipe) gymId: string,
    @Body() dto: CreateDisciplineDto,
  ): Promise<Discipline> {
    return this.disciplinesService.create(gymId, dto);
  }
  @Get()
  findAll(@Param('gymId', ParseUUIDPipe) gymId: string): Promise<Discipline[]> {
    return this.disciplinesService.findAll(gymId);
  }
  @Get(':id')
  findOne(
    @Param('gymId', ParseUUIDPipe) gymId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Discipline> {
    return this.disciplinesService.findOne(gymId, id);
  }

  @Patch(':id')
  update(
    @Param('gymId', ParseUUIDPipe) gymId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisciplineDto,
  ): Promise<Discipline> {
    return this.disciplinesService.update(gymId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('gymId', ParseUUIDPipe) gymId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.disciplinesService.remove(gymId, id);
  }
}
