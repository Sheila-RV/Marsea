import { PartialType } from '@nestjs/mapped-types';
import { CreateDisciplineDto } from './create-discipline.dto';
import { IsBoolean, IsOptional } from 'class-validator';
export class UpdateDisciplineDto extends PartialType(CreateDisciplineDto) {
  // agrega isActive opcional y booleano
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
