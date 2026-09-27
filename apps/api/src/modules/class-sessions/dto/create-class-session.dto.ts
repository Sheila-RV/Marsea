import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateClassSessionDto {
  @ApiProperty({ example: 'b6e6a5b0-...' })
  @IsUUID()
  disciplineId!: string;

  @ApiProperty({ example: 'Carla Gómez' })
  @IsString()
  @Length(2, 100)
  instructorName!: string;

  @ApiProperty({ example: '2026-09-28T09:00:00.000Z' })
  @IsISO8601()
  startsAt!: string;

  @ApiProperty({ example: '2026-09-28T10:00:00.000Z' })
  @IsISO8601()
  endsAt!: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  capacity!: number;
}
