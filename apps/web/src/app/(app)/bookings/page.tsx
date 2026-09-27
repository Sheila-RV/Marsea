"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarX2 } from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookingStatus } from "@/types/api";

const STATUS_LABEL: Record<BookingStatus, string> = {
  BOOKED: "Reservada",
  ATTENDED: "Asististe",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asististe",
};

const STATUS_VARIANT: Record<BookingStatus, "default" | "secondary" | "destructive"> = {
  BOOKED: "default",
  ATTENDED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

export default function MyBookingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: bookingsApi.findMine,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success("Reserva cancelada");
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["available-classes"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo cancelar",
      );
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mis reservas</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CalendarX2 className="h-8 w-8" />
            <p>Todavía no tienes reservas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((booking) => {
            const startsAt = new Date(booking.classSession.startsAt);
            const canCancel =
              booking.status === "BOOKED" && startsAt > new Date();

            return (
              <Card key={booking.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-medium">
                      {booking.classSession.discipline.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(startsAt, "EEEE d 'de' MMMM, HH:mm", {
                        locale: es,
                      })}{" "}
                      · {booking.classSession.instructorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[booking.status]}>
                      {STATUS_LABEL[booking.status]}
                    </Badge>
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(booking.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
