import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Solo Spinning' })
  @IsString()
  @Length(2, 80)
  name!: string;

  @ApiProperty({ example: 150, description: 'Precio mensual' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  durationDays!: number;

  @ApiProperty({
    example: ['b6e6a5b0-...'],
    description: 'Disciplinas que cubre este plan; al menos una',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  disciplineIds!: string[];
}
