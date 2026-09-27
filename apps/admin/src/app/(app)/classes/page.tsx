"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Clock, Plus, Repeat, Trash2, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  bookingsApi,
  classSessionsApi,
  disciplinesApi,
  recurringClassesApi,
} from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { GymScopeGuard } from "@/components/gym-scope-guard";
import { DayStrip } from "@/components/day-strip";
import { cn } from "@/lib/utils";
import type { ClassSession } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const createSchema = z.object({
  disciplineId: z.string().min(1, "Elige una disciplina"),
  instructorName: z.string().min(2, "Mínimo 2 caracteres"),
  startsAt: z.string().min(1, "Requerido"),
  endsAt: z.string().min(1, "Requerido"),
  capacity: z.coerce.number().int().min(1, "Mínimo 1"),
});

type CreateFormValues = z.infer<typeof createSchema>;

const recurringSchema = z.object({
  disciplineId: z.string().min(1, "Elige una disciplina"),
  instructorName: z.string().min(2, "Mínimo 2 caracteres"),
  capacity: z.coerce.number().int().min(1, "Mínimo 1"),
  daysOfWeek: z.array(z.number()).min(1, "Elige al menos un día"),
  startTime: z.string().min(1, "Requerido"),
  durationMinutes: z.coerce.number().int().min(1, "Mínimo 1"),
  rangeStart: z.string().min(1, "Requerido"),
  rangeEnd: z.string().min(1, "Requerido"),
});

type RecurringFormValues = z.infer<typeof recurringSchema>;

const WEEKDAY_LABELS = [
  { value: 0, label: "D" },
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "M" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
];

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

export default function ClassesPage() {
  const { payload } = useAuth();
  const isGymAdmin = payload?.role === "ADMIN";
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["class-sessions"],
    queryFn: () => classSessionsApi.findAll(),
    enabled: isGymAdmin,
  });

  const { data: disciplines } = useQuery({
    queryKey: ["disciplines"],
    queryFn: disciplinesApi.findAll,
    enabled: isGymAdmin,
  });

  const { data: sessionBookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["session-bookings", activeSession?.id],
    queryFn: () => bookingsApi.findForSession(activeSession!.id),
    enabled: !!activeSession && isGymAdmin,
  });

  const { data: recurringClasses } = useQuery({
    queryKey: ["recurring-classes"],
    queryFn: recurringClassesApi.findAll,
    enabled: isGymAdmin,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) });

  const {
    control: recurringControl,
    register: registerRecurring,
    handleSubmit: handleRecurringSubmit,
    reset: resetRecurring,
    formState: { errors: recurringErrors },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { daysOfWeek: [], durationMinutes: 60, capacity: 15 },
  });

  const createRecurringMutation = useMutation({
    mutationFn: recurringClassesApi.create,
    onSuccess: (created) => {
      toast.success(
        `Clase recurrente creada: ${created.generatedSessionsCount} sesiones generadas`,
      );
      setRecurringOpen(false);
      resetRecurring();
      void queryClient.invalidateQueries({ queryKey: ["recurring-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear",
      );
    },
  });

  const removeRecurringMutation = useMutation({
    mutationFn: recurringClassesApi.remove,
    onSuccess: () => {
      toast.success("Clase recurrente eliminada y sesiones futuras canceladas");
      void queryClient.invalidateQueries({ queryKey: ["recurring-classes"] });
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo eliminar",
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      classSessionsApi.create({
        ...values,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Clase creada");
      setCreateOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear",
      );
    },
  });

  const checkInMutation = useMutation({
    mutationFn: bookingsApi.checkIn,
    onSuccess: () => {
      toast.success("Asistencia marcada");
      void queryClient.invalidateQueries({
        queryKey: ["session-bookings", activeSession?.id],
      });
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo marcar",
      );
    },
  });

  const visibleDays = useMemo(() => buildVisibleDays(weekOffset), [weekOffset]);

  const daySessions = (sessions ?? [])
    .filter((session) => isSameDay(new Date(session.startsAt), selectedDay))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  if (payload && !isGymAdmin) {
    return <GymScopeGuard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Clases</h1>
        <div className="flex gap-2">
          <Dialog open={recurringOpen} onOpenChange={setRecurringOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <Repeat className="h-4 w-4" />
              Clase recurrente
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva clase recurrente</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleRecurringSubmit((values) =>
                  createRecurringMutation.mutate(values),
                )}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Controller
                    control={recurringControl}
                    name="disciplineId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Elige una disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {(disciplines ?? []).map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {recurringErrors.disciplineId && (
                    <p className="text-sm text-destructive">
                      {recurringErrors.disciplineId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurringInstructorName">Instructor</Label>
                  <Input
                    id="recurringInstructorName"
                    {...registerRecurring("instructorName")}
                  />
                  {recurringErrors.instructorName && (
                    <p className="text-sm text-destructive">
                      {recurringErrors.instructorName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Días de la semana</Label>
                  <Controller
                    control={recurringControl}
                    name="daysOfWeek"
                    render={({ field }) => (
                      <div className="flex gap-1.5">
                        {WEEKDAY_LABELS.map((day) => {
                          const checked = field.value.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() =>
                                field.onChange(
                                  checked
                                    ? field.value.filter((d) => d !== day.value)
                                    : [...field.value, day.value],
                                )
                              }
                              className={cn(
                                "h-9 w-9 rounded-full border text-sm font-medium transition-colors",
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:bg-accent",
                              )}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {recurringErrors.daysOfWeek && (
                    <p className="text-sm text-destructive">
                      {recurringErrors.daysOfWeek.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...registerRecurring("startTime")}
                    />
                    {recurringErrors.startTime && (
                      <p className="text-sm text-destructive">Requerido</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationMinutes">Duración (min)</Label>
                    <Input
                      id="durationMinutes"
                      type="number"
                      {...registerRecurring("durationMinutes")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="rangeStart">Desde</Label>
                    <Input
                      id="rangeStart"
                      type="date"
                      {...registerRecurring("rangeStart")}
                    />
                    {recurringErrors.rangeStart && (
                      <p className="text-sm text-destructive">Requerido</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rangeEnd">Hasta</Label>
                    <Input
                      id="rangeEnd"
                      type="date"
                      {...registerRecurring("rangeEnd")}
                    />
                    {recurringErrors.rangeEnd && (
                      <p className="text-sm text-destructive">Requerido</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurringCapacity">Cupo</Label>
                  <Input
                    id="recurringCapacity"
                    type="number"
                    {...registerRecurring("capacity")}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createRecurringMutation.isPending}>
                    Crear y generar clases
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Nueva clase
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva clase</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Controller
                  control={control}
                  name="disciplineId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elige una disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {(disciplines ?? []).map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.disciplineId && (
                  <p className="text-sm text-destructive">
                    {errors.disciplineId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructorName">Instructor</Label>
                <Input id="instructorName" {...register("instructorName")} />
                {errors.instructorName && (
                  <p className="text-sm text-destructive">
                    {errors.instructorName.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Empieza</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    {...register("startsAt")}
                  />
                  {errors.startsAt && (
                    <p className="text-sm text-destructive">Requerido</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">Termina</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    {...register("endsAt")}
                  />
                  {errors.endsAt && (
                    <p className="text-sm text-destructive">Requerido</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Cupo</Label>
                <Input id="capacity" type="number" {...register("capacity")} />
                {errors.capacity && (
                  <p className="text-sm text-destructive">
                    {errors.capacity.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Crear clase
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {recurringClasses && recurringClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clases recurrentes activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recurringClasses.map((template) => (
              <div
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {template.disciplineName} · {template.instructorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.daysOfWeek
                      .slice()
                      .sort()
                      .map((d) => WEEKDAY_LABELS[d].label)
                      .join(" ")}{" "}
                    · {template.startTime} ({template.durationMinutes} min) ·{" "}
                    {template.generatedSessionsCount} sesiones generadas
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="icon" />}
                  >
                    <Trash2 className="h-4 w-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Eliminar esta clase recurrente?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Se cancelarán las sesiones futuras generadas por esta
                        plantilla, incluidas las que ya tengan reservas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeRecurringMutation.mutate(template.id)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DayStrip
        days={visibleDays}
        selected={selectedDay}
        onSelect={setSelectedDay}
        onShiftWeek={(direction) => setWeekOffset((w) => w + direction)}
      />

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
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No hay clases programadas este día.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {daySessions.map((session, index) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSession(session)}
                className={cn(
                  "flex w-full flex-wrap items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent/50",
                  index > 0 && "border-t border-border",
                )}
              >
                <div className="w-32 shrink-0 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(session.startsAt), "HH:mm")}
                  </span>
                  <span className="text-xs">
                    hasta {format(new Date(session.endsAt), "HH:mm")}
                  </span>
                </div>

                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium">{session.disciplineName}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.instructorName}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {session.bookedCount}/{session.capacity}
                </div>

                {session.status !== "SCHEDULED" && (
                  <Badge variant="outline" className="shrink-0">
                    {session.status === "CANCELLED" ? "Cancelada" : "Completada"}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!activeSession}
        onOpenChange={(open) => !open && setActiveSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeSession?.disciplineName} —{" "}
              {activeSession &&
                format(new Date(activeSession.startsAt), "d MMM, HH:mm", {
                  locale: es,
                })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {isLoadingBookings ? (
              <Skeleton className="h-24 w-full" />
            ) : !sessionBookings || sessionBookings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nadie ha reservado esta clase todavía.
              </p>
            ) : (
              sessionBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {booking.userFullName}
                    </p>
                    <Badge variant="secondary" className="mt-0.5">
                      {booking.status}
                    </Badge>
                  </div>
                  {booking.status === "BOOKED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={checkInMutation.isPending}
                      onClick={() => checkInMutation.mutate(booking.id)}
                    >
                      Marcar asistencia
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
