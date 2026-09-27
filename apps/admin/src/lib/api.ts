import { apiFetch } from "./api-client";
import type {
  AdminDashboard,
  ClassSession,
  Discipline,
  Gym,
  GymWithFirstAdmin,
  JwtPayload,
  Membership,
  Plan,
  QrCodeResponse,
  RecurringClass,
  SessionBooking,
  CheckInResult,
  SuperAdminDashboard,
  UserResponse,
} from "@/types/api";

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
  me: () => apiFetch<JwtPayload>("/auth/me"),
};

export const usersApi = {
  getMe: () => apiFetch<UserResponse>("/users/me"),
  findAll: () => apiFetch<UserResponse[]>("/users"),
  create: (data: { email: string; password: string; fullName: string }) =>
    apiFetch<UserResponse>("/users", { method: "POST", body: data }),
  update: (id: string, data: { fullName?: string; isActive?: boolean }) =>
    apiFetch<UserResponse>(`/users/${id}`, { method: "PATCH", body: data }),
  getQrCode: (id: string) => apiFetch<QrCodeResponse>(`/users/${id}/qr-code`),
};

interface DisciplineWriteData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const disciplinesApi = {
  findAll: () => apiFetch<Discipline[]>("/disciplines"),
  create: (data: DisciplineWriteData) =>
    apiFetch<Discipline>("/disciplines", { method: "POST", body: data }),
  update: (id: string, data: DisciplineWriteData) =>
    apiFetch<Discipline>(`/disciplines/${id}`, { method: "PATCH", body: data }),
  remove: (id: string) =>
    apiFetch<void>(`/disciplines/${id}`, { method: "DELETE" }),
};

export const plansApi = {
  findAll: () => apiFetch<Plan[]>("/plans"),
  create: (data: {
    name: string;
    price: number;
    durationDays: number;
    disciplineIds: string[];
  }) => apiFetch<Plan>("/plans", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      price: number;
      durationDays: number;
      disciplineIds: string[];
      isActive: boolean;
    }>,
  ) => apiFetch<Plan>(`/plans/${id}`, { method: "PATCH", body: data }),
};

export const membershipsApi = {
  findAll: (userId?: string) =>
    apiFetch<Membership[]>(
      userId ? `/memberships?userId=${userId}` : "/memberships",
    ),
  create: (data: { userId: string; planId: string; startDate?: string }) =>
    apiFetch<Membership>("/memberships", { method: "POST", body: data }),
  cancel: (id: string) =>
    apiFetch<Membership>(`/memberships/${id}/cancel`, { method: "PATCH" }),
};

export const classSessionsApi = {
  findAll: (params?: { from?: string; to?: string; disciplineId?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as string[][],
    ).toString();
    return apiFetch<ClassSession[]>(
      `/class-sessions${query ? `?${query}` : ""}`,
    );
  },
  create: (data: {
    disciplineId: string;
    instructorName: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
  }) => apiFetch<ClassSession>("/class-sessions", { method: "POST", body: data }),
  update: (
    id: string,
    data: Partial<{
      disciplineId: string;
      instructorName: string;
      startsAt: string;
      endsAt: string;
      capacity: number;
    }>,
  ) =>
    apiFetch<ClassSession>(`/class-sessions/${id}`, {
      method: "PATCH",
      body: data,
    }),
  cancel: (id: string) =>
    apiFetch<void>(`/class-sessions/${id}`, { method: "DELETE" }),
};

export const bookingsApi = {
  findForSession: (classSessionId: string) =>
    apiFetch<SessionBooking[]>(`/bookings?classSessionId=${classSessionId}`),
  checkIn: (id: string) =>
    apiFetch<SessionBooking>(`/bookings/${id}/check-in`, { method: "PATCH" }),
  cancel: (id: string) =>
    apiFetch<SessionBooking>(`/bookings/${id}/cancel`, { method: "PATCH" }),
};

export const checkInApi = {
  scan: (qrCode: string) =>
    apiFetch<CheckInResult>("/check-in/scan", {
      method: "POST",
      body: { qrCode },
    }),
};

export const gymsApi = {
  findAll: () => apiFetch<Gym[]>("/gyms"),
  create: (data: {
    name: string;
    slug: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
  }) => apiFetch<GymWithFirstAdmin>("/gyms", { method: "POST", body: data }),
  getMine: () => apiFetch<Gym>("/gyms/me"),
  updateMine: (data: { name?: string; logoUrl?: string }) =>
    apiFetch<Gym>("/gyms/me", { method: "PATCH", body: data }),
};

export const dashboardApi = {
  getAdmin: () => apiFetch<AdminDashboard>("/dashboard/admin"),
  getSuperAdmin: () => apiFetch<SuperAdminDashboard>("/dashboard/super-admin"),
};

export const recurringClassesApi = {
  findAll: () => apiFetch<RecurringClass[]>("/recurring-classes"),
  create: (data: {
    disciplineId: string;
    instructorName: string;
    capacity: number;
    daysOfWeek: number[];
    startTime: string;
    durationMinutes: number;
    rangeStart: string;
    rangeEnd: string;
  }) =>
    apiFetch<RecurringClass>("/recurring-classes", {
      method: "POST",
      body: data,
    }),
  remove: (id: string) =>
    apiFetch<void>(`/recurring-classes/${id}`, { method: "DELETE" }),
};
