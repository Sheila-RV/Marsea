"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  IdCard,
  Users,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { dashboardApi } from "@/lib/api";
import { StatTile } from "@/components/charts/stat-tile";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BookingStatus } from "@/types/api";

function formatCurrency(value: string): string {
  return `$${Number(value).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  BOOKED: "Reservada",
  ATTENDED: "Asistió",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const STATUS_VARIANT: Record<
  BookingStatus,
  "default" | "secondary" | "destructive"
> = {
  BOOKED: "default",
  ATTENDED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

function GreetingBanner({ name, gymName }: { name: string; gymName?: string }) {
  return (
    <div className="rounded-2xl bg-primary px-6 py-5 text-primary-foreground">
      <p className="text-lg font-semibold">Hola, {name}</p>
      <p className="text-sm opacity-85">
        {gymName ? `Esto es lo que pasa hoy en ${gymName}.` : "Este es tu resumen de hoy."}
      </p>
    </div>
  );
}

function AdminDashboardView() {
  const { profile } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: dashboardApi.getAdmin,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const bookingsChartData = data.bookingsPerDay.map((point) => ({
    label: format(new Date(`${point.date}T00:00:00`), "d"),
    tooltipLabel: format(new Date(`${point.date}T00:00:00`), "EEEE d 'de' MMM", {
      locale: es,
    }),
    value: point.count,
  }));

  return (
    <div className="space-y-6">
      <GreetingBanner name={profile?.fullName ?? ""} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Miembros"
          value={String(data.totalMembers)}
          icon={Users}
          deltaPct={data.membersDeltaPct}
          deltaCaption="nuevos"
        />
        <StatTile
          label="Membresías activas"
          value={String(data.activeMemberships)}
          icon={IdCard}
        />
        <StatTile
          label="Ingresos mensuales"
          value={formatCurrency(data.monthlyMembershipRevenue)}
          icon={DollarSign}
        />
        <StatTile
          label="Clases programadas"
          value={String(data.upcomingClassSessions)}
          icon={CalendarClock}
        />
        <StatTile
          label="Reservas (30 días)"
          value={String(data.bookings30d.total)}
          deltaPct={data.bookings30d.deltaPct}
        />
        <StatTile
          label="Asistencias confirmadas"
          value={String(data.bookings30d.confirmed)}
          icon={CheckCircle2}
        />
        <StatTile
          label="Canceladas"
          value={String(data.bookings30d.cancelled)}
          icon={XCircle}
        />
        <StatTile label="Pendientes" value={String(data.bookings30d.pending)} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Reservas recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentBookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no hay reservas.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.memberFullName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {booking.disciplineName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(booking.classStartsAt), "d MMM, HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[booking.status]}>
                          {STATUS_LABEL[booking.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Membresías por plan</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={data.membershipsByPlan.map((p) => ({
                label: p.planName,
                value: p.count,
              }))}
              centerLabel="Activas"
              centerValue={String(data.activeMemberships)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Reservas por día — últimos 14 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={bookingsChartData} color="#2a78d6" />
        </CardContent>
      </Card>
    </div>
  );
}

function SuperAdminDashboardView() {
  const { profile } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "super-admin"],
    queryFn: dashboardApi.getSuperAdmin,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const gymsChartData = data.activeMembersByGym.map((gym) => ({
    label: gym.gymName.length > 8 ? `${gym.gymName.slice(0, 7)}…` : gym.gymName,
    tooltipLabel: gym.gymName,
    value: gym.activeMembers,
  }));

  return (
    <div className="space-y-6">
      <GreetingBanner name={profile?.fullName ?? ""} gymName="toda la plataforma" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Gimnasios" value={String(data.totalGyms)} icon={Building2} />
        <StatTile
          label="Gimnasios activos"
          value={String(data.activeGyms)}
          icon={CheckCircle2}
        />
        <StatTile label="Miembros (todos)" value={String(data.totalMembers)} icon={Users} />
        <StatTile
          label="Membresías activas (todas)"
          value={String(data.totalActiveMemberships)}
          icon={IdCard}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatTile
          label="Ingresos mensuales estimados"
          value={formatCurrency(data.totalMonthlyMembershipRevenue)}
          icon={DollarSign}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Miembros activos por gimnasio</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={gymsChartData} color="#2a78d6" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { payload } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {payload?.role === "SUPER_ADMIN" ? (
        <SuperAdminDashboardView />
      ) : (
        <AdminDashboardView />
      )}
    </div>
  );
}
