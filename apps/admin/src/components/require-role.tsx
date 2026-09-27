"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/types/api";
import { Loader2 } from "lucide-react";

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
}

// Protección de rutas del lado del cliente. En Next.js 16 el middleware
// (ahora llamado "Proxy") solo sirve para chequeos optimistas, no para
// autorización real, así que la puerta de entrada vive aquí, donde ya
// tenemos el token decodificado por AuthProvider.
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { payload, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!payload) {
      router.replace("/login");
      return;
    }

    if (!roles.includes(payload.role)) {
      logout();
    }
  }, [isLoading, payload, roles, router, logout]);

  if (isLoading || !payload || !roles.includes(payload.role)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
