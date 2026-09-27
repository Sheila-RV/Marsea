import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({ example: 'b6e6a5b0-...' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'b6e6a5b0-...' })
  @IsUUID()
  planId!: string;

  @ApiProperty({
    required: false,
    example: '2026-09-25',
    description: 'Por defecto, hoy',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;
}
