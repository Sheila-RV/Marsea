import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDisciplineDto } from './create-discipline.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDisciplineDto extends PartialType(CreateDisciplineDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
