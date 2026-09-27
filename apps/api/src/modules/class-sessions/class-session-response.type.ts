export interface ClassSessionResponse {
  id: string;
  disciplineId: string;
  disciplineName: string;
  instructorName: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  status: string;
  bookedCount: number;
  remainingCapacity: number;
  isBookedByMe: boolean;
  myBookingId: string | null;
}
