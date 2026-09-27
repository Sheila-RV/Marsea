"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ScanLine } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { checkInApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { GymScopeGuard } from "@/components/gym-scope-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CheckInResult } from "@/types/api";

// Pensado para un lector de código de barras/QR físico: esos dispositivos
// "escriben" el código en el campo enfocado y mandan Enter solos, así que
// basta con mantener el input siempre enfocado.
export default function CheckInPage() {
  const { payload } = useAuth();
  const [code, setCode] = useState("");
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scanMutation = useMutation({
    mutationFn: (qrCode: string) => checkInApi.scan(qrCode),
    onSuccess: (result) => {
      setLastResult(result);
      setLastError(null);
    },
    onError: (error) => {
      setLastResult(null);
      setLastError(
        error instanceof ApiError ? error.message : "No se pudo procesar",
      );
    },
    onSettled: () => {
      setCode("");
      inputRef.current?.focus();
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    scanMutation.mutate(code.trim());
  }

  if (payload && payload.role !== "ADMIN") {
    return <GymScopeGuard />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Check-in por QR</h1>

      <Card className="max-w-md">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScanLine className="h-5 w-5" />
          </div>
          <CardTitle>Escanear código</CardTitle>
          <CardDescription>
            Escanea el QR del miembro o escribe el código manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="qrCode" className="sr-only">
                Código QR
              </Label>
              <Input
                id="qrCode"
                ref={inputRef}
                autoFocus
                placeholder="qr_..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={scanMutation.isPending}>
              Confirmar
            </Button>
          </form>
        </CardContent>
      </Card>

      {lastResult && (
        <Card className="max-w-md border-primary/50 bg-accent/40">
          <CardContent className="flex items-start gap-3 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">
                {lastResult.memberFullName} — asistencia registrada
              </p>
              <p className="text-sm text-muted-foreground">
                {lastResult.disciplineName} ·{" "}
                {format(new Date(lastResult.startsAt), "HH:mm", { locale: es })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {lastError && (
        <Card className="max-w-md border-destructive/50">
          <CardContent className="py-4 text-sm text-destructive">
            {lastError}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
