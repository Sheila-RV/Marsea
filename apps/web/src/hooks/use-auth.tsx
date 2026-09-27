"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, usersApi } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/api-client";
import type { JwtPayload, UserResponse } from "@/types/api";

interface AuthContextValue {
  payload: JwtPayload | null;
  profile: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Restaura la sesión al cargar la app (si hay un token guardado, confirma que
// sigue siendo válido contra /auth/me) y expone login/logout a toda la app
// vía contexto. El token vive en localStorage: fase 1 del proyecto, sencilla
// a propósito (ver docs/lessons/06-login-jwt.md).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<JwtPayload | null>(null);
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function restore() {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        setPayload(me);
        setProfile(await usersApi.getMe());
      } catch {
        clearToken();
      } finally {
        setIsLoading(false);
      }
    }
    void restore();
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const { accessToken } = await authApi.login(email, password);
    setToken(accessToken);
    setPayload(await authApi.me());
    setProfile(await usersApi.getMe());
  }

  function logout(): void {
    clearToken();
    setPayload(null);
    setProfile(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ payload, profile, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
