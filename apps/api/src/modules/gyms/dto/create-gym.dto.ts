import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateGymDto {
  @ApiProperty({ example: 'Iron Gym' })
  @IsString()
  @Length(2, 80)
  name!: string;

  @ApiProperty({
    example: 'iron-gym',
    description: 'Solo minúsculas, números y guiones',
  })
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must contain only lowercase letters, numbers and hyphens',
  })
  slug!: string;

  @ApiProperty({ example: 'admin@iron-gym.dev' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ example: 'IronAdmin123!', minLength: 8, maxLength: 72 })
  @IsString()
  @Length(8, 72)
  adminPassword!: string;

  @ApiProperty({ example: 'Admin de Iron Gym' })
  @IsString()
  @Length(2, 100)
  adminFullName!: string;
}
