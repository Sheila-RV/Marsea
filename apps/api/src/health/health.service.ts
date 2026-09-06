import { Injectable } from '@nestjs/common';
import { HealthStatus } from './health-status.interface';

@Injectable()
export class HealthService {
  check(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
