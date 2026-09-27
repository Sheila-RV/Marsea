import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

// Lo que el admin de UN gimnasio puede tocar de su propio perfil: nombre y
// logo. Crear/listar gimnasios sigue siendo cosa de la super admin (ver
// GymsController y CreateGymDto).
export class UpdateGymDto {
  @ApiProperty({ required: false, example: 'Iron Gym' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @ApiProperty({ required: false, description: 'Logo del gimnasio' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  logoUrl?: string;
}
