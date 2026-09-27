import { apiFetch } from "./api-client";
import type {
  ActiveMembership,
  ClassSession,
  JwtPayload,
  MyBooking,
  QrCodeResponse,
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
  getMyQrCode: () => apiFetch<QrCodeResponse>("/users/me/qr-code"),
};

export const membershipsApi = {
  getMine: () => apiFetch<ActiveMembership>("/me/membership"),
};

export const classSessionsApi = {
  getAvailable: () => apiFetch<ClassSession[]>("/class-sessions/available"),
};

export const bookingsApi = {
  create: (classSessionId: string) =>
    apiFetch<MyBooking>("/bookings", { method: "POST", body: { classSessionId } }),
  findMine: () => apiFetch<MyBooking[]>("/bookings/me"),
  cancel: (id: string) =>
    apiFetch<MyBooking>(`/bookings/${id}/cancel`, { method: "PATCH" }),
};
