export interface BookingResponse {
  id: string;
  status: string;
  bookedAt: Date;
  checkedInAt: Date | null;
  classSessionId: string;
  userId: string;
  userFullName?: string;
}
