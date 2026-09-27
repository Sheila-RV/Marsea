"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarX2, Clock, Zap } from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { BookingStatus, MyBooking } from "@/types/api";

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

type Filter = "all" | "upcoming" | "past";

function matchesFilter(booking: MyBooking, filter: Filter): boolean {
  if (filter === "all") return true;
  const isUpcoming =
    booking.status === "BOOKED" &&
    new Date(booking.classSession.startsAt) > new Date();
  return filter === "upcoming" ? isUpcoming : !isUpcoming;
}

export default function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");

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

  const bookings = (data ?? []).filter((b) => matchesFilter(b, filter));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Panel de socio
          </span>
          <h1 className="font-serif text-3xl font-bold">Mis reservas</h1>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/60 p-1">
          {(
            [
              { key: "all", label: "Todas" },
              { key: "upcoming", label: "Próximas" },
              { key: "past", label: "Pasadas" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                filter === option.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-white/50",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CalendarX2 className="h-8 w-8" />
            <p>No hay reservas para mostrar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const startsAt = new Date(booking.classSession.startsAt);
            const canCancel =
              booking.status === "BOOKED" && startsAt > new Date();

            return (
              <Card key={booking.id}>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl",
                        canCancel
                          ? "bg-primary/10 text-primary"
                          : "bg-[#B7D1EA]/40 text-primary",
                      )}
                    >
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {format(startsAt, "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <h3 className="font-serif text-lg font-bold">
                        {booking.classSession.discipline.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {format(startsAt, "HH:mm")} ·{" "}
                        {booking.classSession.instructorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3 md:justify-end md:border-t-0 md:pt-0">
                    <Badge variant={STATUS_VARIANT[booking.status]}>
                      {STATUS_LABEL[booking.status]}
                    </Badge>
                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
