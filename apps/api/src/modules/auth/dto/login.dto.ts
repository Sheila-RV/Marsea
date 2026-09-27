import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@demo-gym.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'DemoAdmin123!' })
  @IsString()
  password!: string;
}
