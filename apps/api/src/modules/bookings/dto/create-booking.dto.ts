import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'b6e6a5b0-...' })
  @IsUUID()
  classSessionId!: string;
}
