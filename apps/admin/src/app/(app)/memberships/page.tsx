"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { membershipsApi, plansApi, usersApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { GymScopeGuard } from "@/components/gym-scope-guard";
import type { MembershipStatus } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  userId: z.string().min(1, "Elige un miembro"),
  planId: z.string().min(1, "Elige un plan"),
});

type FormValues = z.infer<typeof schema>;

const STATUS_VARIANT: Record<MembershipStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  EXPIRED: "outline",
  CANCELLED: "outline",
};

const STATUS_LABEL: Record<MembershipStatus, string> = {
  ACTIVE: "Activa",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
};

export default function MembershipsPage() {
  const { payload } = useAuth();
  const isGymAdmin = payload?.role === "ADMIN";
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["memberships"],
    queryFn: () => membershipsApi.findAll(),
    enabled: isGymAdmin,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.findAll,
    enabled: isGymAdmin,
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.findAll,
    enabled: isGymAdmin,
  });

  const members = (users ?? []).filter((u) => u.role === "MEMBER");
  const usersById = new Map((users ?? []).map((u) => [u.id, u]));
  const plansById = new Map((plans ?? []).map((p) => [p.id, p]));

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["memberships"] });
  }

  const { control, handleSubmit, reset, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: membershipsApi.create,
    onSuccess: () => {
      toast.success("Membresía asignada");
      setCreateOpen(false);
      reset();
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo asignar",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: membershipsApi.cancel,
    onSuccess: () => {
      toast.success("Membresía cancelada");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo cancelar",
      );
    },
  });

  if (payload && !isGymAdmin) {
    return <GymScopeGuard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Membresías</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Asignar plan
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar plan a un miembro</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Miembro</Label>
                <Controller
                  control={control}
                  name="userId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elige un miembro" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.fullName} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.userId && (
                  <p className="text-sm text-destructive">
                    {errors.userId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Controller
                  control={control}
                  name="planId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elige un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {(plans ?? []).map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} — ${plan.price} / {plan.durationDays}d
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.planId && (
                  <p className="text-sm text-destructive">
                    {errors.planId.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Asignar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membresías del gimnasio</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !memberships || memberships.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no hay membresías asignadas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">
                      {usersById.get(membership.userId)?.fullName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {plansById.get(membership.planId)?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(membership.startDate), "d MMM", {
                        locale: es,
                      })}{" "}
                      –{" "}
                      {format(new Date(membership.endDate), "d MMM yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[membership.status]}>
                        {STATUS_LABEL[membership.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {membership.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(membership.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
