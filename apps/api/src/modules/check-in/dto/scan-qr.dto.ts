import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ScanQrDto {
  @ApiProperty({ example: 'qr_3c9c9c...' })
  @IsString()
  qrCode!: string;
}
