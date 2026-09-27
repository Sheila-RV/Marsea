import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateRecurringClassDto {
  @ApiProperty({ example: 'b6e6a5b0-...' })
  @IsUUID()
  disciplineId!: string;

  @ApiProperty({ example: 'Carla Gómez' })
  @IsString()
  instructorName!: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiProperty({
    example: [1, 3, 5],
    description: 'Días de la semana: 0=domingo ... 6=sábado',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek!: number[];

  @ApiProperty({ example: '07:00', description: 'Hora del día, formato HH:mm' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string;

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiProperty({ example: '2026-10-01' })
  @IsISO8601()
  rangeStart!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsISO8601()
  rangeEnd!: string;
}
