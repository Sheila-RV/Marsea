"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowRight, Clock, UserRound } from "lucide-react";
import { classSessionsApi, bookingsApi, membershipsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { DayStrip } from "@/components/day-strip";
import { BookingConfirmDialog } from "@/components/booking-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClassSession } from "@/types/api";

function buildVisibleDays(weekOffset: number): Date[] {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + weekOffset * 7);
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

function dayHeading(day: Date): string {
  if (isToday(day)) return `Hoy, ${format(day, "d 'de' MMMM", { locale: es })}`;
  if (isTomorrow(day))
    return `Mañana, ${format(day, "d 'de' MMMM", { locale: es })}`;
  return format(day, "EEEE d 'de' MMMM", { locale: es });
}

export default function AvailableClassesPage() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [confirmingSession, setConfirmingSession] = useState<ClassSession | null>(
    null,
  );

  const { data: membership, isLoading: isLoadingMembership } = useQuery({
    queryKey: ["my-membership"],
    queryFn: membershipsApi.getMine,
    retry: false,
  });

  const {
    data: sessions,
    isLoading: isLoadingSessions,
    isError,
  } = useQuery({
    queryKey: ["available-classes"],
    queryFn: classSessionsApi.getAvailable,
  });

  const bookMutation = useMutation({
    mutationFn: (session: ClassSession) => bookingsApi.create(session.id),
    onSuccess: () => {
      toast.success("Reserva confirmada");
      setConfirmingSession(null);
      void queryClient.invalidateQueries({ queryKey: ["available-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo reservar",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      toast.success("Reserva cancelada");
      void queryClient.invalidateQueries({ queryKey: ["available-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo cancelar",
      );
    },
  });

  const visibleDays = useMemo(() => buildVisibleDays(weekOffset), [weekOffset]);

  const daySessions = (sessions ?? [])
    .filter((session) => isSameDay(new Date(session.startsAt), selectedDay))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const isLoading = isLoadingMembership || isLoadingSessions;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Panel de socio
        </span>
        <h1 className="font-serif text-3xl font-bold">Clases disponibles</h1>
        {membership && (
          <p className="text-sm text-muted-foreground">
            Tu plan es{" "}
            <Badge variant="secondary" className="align-middle">
              {membership.planName}
            </Badge>{" "}
            — solo ves clases de las disciplinas que cubre.
          </p>
        )}
        {!isLoadingMembership && !membership && (
          <p className="text-sm text-muted-foreground">
            No tienes una membresía activa. Pide a tu gimnasio que te asigne un
            plan para poder reservar clases.
          </p>
        )}
      </div>

      <DayStrip
        days={visibleDays}
        selected={selectedDay}
        onSelect={setSelectedDay}
        onShiftWeek={(direction) => setWeekOffset((w) => w + direction)}
      />

      {isError && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            No se pudieron cargar las clases disponibles. Intenta de nuevo.
          </CardContent>
        </Card>
      )}

      <div>
        <p className="mb-3 text-sm font-medium capitalize text-foreground">
          {dayHeading(selectedDay)}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : daySessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No hay clases disponibles este día.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {daySessions.map((session) => {
              const isFull = session.remainingCapacity <= 0;
              const durationMin = Math.round(
                (new Date(session.endsAt).getTime() -
                  new Date(session.startsAt).getTime()) /
                  60000,
              );

              return (
                <Card
                  key={session.id}
                  className={cn(
                    "justify-between",
                    session.isBookedByMe && "ring-2 ring-success/40",
                  )}
                >
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 rounded-lg bg-[#B7D1EA]/40 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.startsAt), "HH:mm")}
                      </span>
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-medium",
                          isFull
                            ? "bg-destructive/10 text-destructive"
                            : session.remainingCapacity <= 3
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {isFull
                          ? "Sin cupo"
                          : `${session.remainingCapacity} lugares libres`}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold">
                      {session.disciplineName}
                    </h3>

                    <div className="space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <UserRound className="h-3.5 w-3.5 text-primary" />
                          Instructor:
                        </span>
                        <span className="font-semibold text-foreground">
                          {session.instructorName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          Duración:
                        </span>
                        <span className="font-semibold text-foreground">
                          {durationMin} minutos
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="justify-between border-t border-border bg-transparent">
                    <span className="font-mono text-xs text-muted-foreground">
                      {session.bookedCount}/{session.capacity} inscritos
                    </span>
                    {session.isBookedByMe ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-success">
                          Confirmada
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancelMutation.isPending}
                          onClick={() => {
                            if (session.myBookingId) {
                              cancelMutation.mutate(session.myBookingId);
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isFull}
                        onClick={() => setConfirmingSession(session)}
                      >
                        {isFull ? "Sin cupo" : "Reservar lugar"}
                        {!isFull && <ArrowRight className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BookingConfirmDialog
        session={confirmingSession}
        planName={membership?.planName}
        isSubmitting={bookMutation.isPending}
        onOpenChange={(open) => !open && setConfirmingSession(null)}
        onConfirm={() => {
          if (confirmingSession) bookMutation.mutate(confirmingSession);
        }}
      />
    </div>
  );
}
