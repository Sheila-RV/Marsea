import type { ApiErrorBody } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "gym_admin_token";

export class ApiError extends Error {
  statusCode: number;
  path: string;

  constructor(statusCode: number, message: string, path: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.path = path;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  auth?: boolean;
}

function extractMessage(body: ApiErrorBody | null, status: number): string {
  if (!body) return `Error ${status}`;
  return Array.isArray(body.message) ? body.message.join(", ") : body.message;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(data as ApiErrorBody | null, response.status),
      path,
    );
  }

  return data as T;
}
