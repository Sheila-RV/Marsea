import { PartialType } from '@nestjs/swagger';
import { CreateClassSessionDto } from './create-class-session.dto';

export class UpdateClassSessionDto extends PartialType(CreateClassSessionDto) {}
