import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class QueryClassSessionsDto {
  @ApiProperty({ required: false, example: '2026-09-28T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiProperty({ required: false, example: '2026-10-05T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  disciplineId?: string;
}
