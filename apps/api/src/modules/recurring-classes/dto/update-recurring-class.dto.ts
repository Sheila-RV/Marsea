import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRecurringClassDto } from './create-recurring-class.dto';

export class UpdateRecurringClassDto extends PartialType(
  CreateRecurringClassDto,
) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
