"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import { usersApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyQrCodePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-qr-code"],
    queryFn: usersApi.getMyQrCode,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mi código QR</h1>

      <Card className="max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <QrCode className="h-5 w-5" />
          </div>
          <CardTitle>Check-in en el gimnasio</CardTitle>
          <CardDescription>
            Muestra este código en recepción para que marquen tu asistencia a
            la clase que reservaste.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {isLoading && <Skeleton className="h-56 w-56 rounded-lg" />}
          {isError && (
            <p className="text-sm text-destructive">
              No se pudo cargar tu código QR.
            </p>
          )}
          {data && (
            <div className="rounded-lg bg-white p-3">
              <Image
                src={data.qrImage}
                alt="Tu código QR"
                width={224}
                height={224}
                unoptimized
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
