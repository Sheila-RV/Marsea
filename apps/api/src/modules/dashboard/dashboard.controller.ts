import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { requireGymId } from '../../common/require-gym-id.util';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '../../generated/prisma/client.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Role.ADMIN)
  @Get('admin')
  getAdminDashboard(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getAdminDashboard(requireGymId(user));
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('super-admin')
  getSuperAdminDashboard() {
    return this.dashboardService.getSuperAdminDashboard();
  }
}
