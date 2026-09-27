import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

// Crea siempre un MEMBER dentro del gimnasio de quien hace la petición.
// El rol y el gymId no se aceptan del cliente: los decide el servidor
// a partir del token del admin que llama a este endpoint (ver L07).
export class CreateUserDto {
  @ApiProperty({ example: 'member@demo-gym.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Member123!', minLength: 8, maxLength: 72 })
  @IsString()
  @Length(8, 72)
  password!: string;

  @ApiProperty({ example: 'Juan Pérez', minLength: 2, maxLength: 100 })
  @IsString()
  @Length(2, 100)
  fullName!: string;
}
