import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckInService } from './check-in.service';
import { ScanQrDto } from './dto/scan-qr.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('check-in')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post('scan')
  scan(@CurrentUser() user: JwtPayload, @Body() dto: ScanQrDto) {
    return this.checkInService.scan(requireGymId(user), dto.qrCode);
  }
}
