import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateDisciplineDto {
  // texto, entre 2 y 50 caracteres
  @IsString()
  @Length(2, 50)
  name!: string;

  // opcional; si viene, texto de máximo 200 caracteres
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
