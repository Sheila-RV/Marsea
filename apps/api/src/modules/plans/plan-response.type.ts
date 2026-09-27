export interface PlanResponse {
  id: string;
  name: string;
  price: string; // Prisma.Decimal se serializa como string para no perder precisión
  durationDays: number;
  isActive: boolean;
  gymId: string;
  disciplines: Array<{ id: string; name: string }>;
}
