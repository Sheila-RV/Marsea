export interface RecurringClassResponse {
  id: string;
  disciplineId: string;
  disciplineName: string;
  instructorName: string;
  capacity: number;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  rangeStart: Date;
  rangeEnd: Date;
  isActive: boolean;
  generatedSessionsCount: number;
}
