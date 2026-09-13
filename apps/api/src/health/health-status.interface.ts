export interface HealthStatus {
  status: 'ok';
  timestamp: string; // ISO 8601, ej. "2026-09-06T14:03:00.000Z"
  uptimeSeconds: number;
  database: 'up' | 'down';
}
