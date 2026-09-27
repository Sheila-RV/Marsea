// Lo que necesitan ClassSessionsService y BookingsService para aplicar la
// regla central: qué disciplinas puede ver/reservar este miembro.
export interface ActiveMembership {
  id: string;
  planId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  disciplineIds: string[];
}
