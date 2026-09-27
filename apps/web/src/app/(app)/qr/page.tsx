"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyQrCodePage() {
  const { profile } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-qr-code"],
    queryFn: usersApi.getMyQrCode,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Panel de socio
        </span>
        <h1 className="font-serif text-3xl font-bold">
          Mi código QR de acceso
        </h1>
        <p className="text-sm text-muted-foreground">
          Presenta este código en recepción al llegar a tu clase para el
          check-in automático.
        </p>
      </div>

      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-6 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">
            <QrCode className="h-7 w-7" />
          </div>

          {isLoading && <Skeleton className="h-56 w-56 rounded-2xl" />}
          {isError && (
            <p className="text-sm text-destructive">
              No se pudo cargar tu código QR.
            </p>
          )}
          {data && (
            <>
              <div className="inline-block rounded-2xl border border-input bg-secondary p-6 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URI generado por el backend, next/image no aporta nada aquí */}
                <img
                  src={data.qrImage}
                  alt="Tu código QR"
                  width={192}
                  height={192}
                  className="mx-auto"
                />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold">
                  {profile?.fullName}
                </h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {data.qrCode}
                </p>
              </div>

              <Button
                render={<a href={data.qrImage} download="mi-codigo-qr.png" />}
                nativeButton={false}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Descargar QR
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
