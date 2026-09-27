"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { disciplinesApi, plansApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { GymScopeGuard } from "@/components/gym-scope-guard";
import type { Plan } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  price: z.coerce.number().positive("Debe ser mayor a 0"),
  durationDays: z.coerce.number().int().min(1, "Mínimo 1 día"),
  disciplineIds: z.array(z.string()).min(1, "Elige al menos una disciplina"),
});

type FormValues = z.infer<typeof schema>;

function PlanForm({
  plan,
  onSubmit,
  isSubmitting,
}: {
  plan?: Plan;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) {
  const { data: disciplines } = useQuery({
    queryKey: ["disciplines"],
    queryFn: disciplinesApi.findAll,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: plan?.name ?? "",
      price: plan ? Number(plan.price) : 0,
      durationDays: plan?.durationDays ?? 30,
      disciplineIds: plan?.disciplines.map((d) => d.id) ?? [],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Plan Full" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input id="price" type="number" step="0.01" {...register("price")} />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationDays">Duración (días)</Label>
          <Input id="durationDays" type="number" {...register("durationDays")} />
          {errors.durationDays && (
            <p className="text-sm text-destructive">
              {errors.durationDays.message}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Disciplinas que cubre</Label>
        <Controller
          control={control}
          name="disciplineIds"
          render={({ field }) => (
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
              {(disciplines ?? []).map((discipline) => {
                const checked = field.value.includes(discipline.id);
                return (
                  <label
                    key={discipline.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        field.onChange(
                          value
                            ? [...field.value, discipline.id]
                            : field.value.filter((id) => id !== discipline.id),
                        );
                      }}
                    />
                    {discipline.name}
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.disciplineIds && (
          <p className="text-sm text-destructive">
            {errors.disciplineIds.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {plan ? "Guardar cambios" : "Crear plan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PlansPage() {
  const { payload } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.findAll,
    enabled: payload?.role === "ADMIN",
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["plans"] });
  }

  function handleError(error: unknown, fallback: string) {
    toast.error(error instanceof ApiError ? error.message : fallback);
  }

  const createMutation = useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => {
      toast.success("Plan creado");
      setCreateOpen(false);
      invalidate();
    },
    onError: (e) => handleError(e, "No se pudo crear el plan"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & FormValues) =>
      plansApi.update(id, data),
    onSuccess: () => {
      toast.success("Plan actualizado");
      setEditing(null);
      invalidate();
    },
    onError: (e) => handleError(e, "No se pudo actualizar"),
  });

  if (payload && payload.role !== "ADMIN") {
    return <GymScopeGuard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Planes</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Nuevo plan
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo plan</DialogTitle>
            </DialogHeader>
            <PlanForm
              onSubmit={(values) => createMutation.mutate(values)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planes de tu gimnasio</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no hay planes. Crea el primero.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Disciplinas</TableHead>
                  <TableHead className="w-16 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>${plan.price}</TableCell>
                    <TableCell>{plan.durationDays} días</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.disciplines.map((d) => (
                          <Badge key={d.id} variant="secondary">
                            {d.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plan</DialogTitle>
          </DialogHeader>
          {editing && (
            <PlanForm
              plan={editing}
              onSubmit={(values) =>
                updateMutation.mutate({ id: editing.id, ...values })
              }
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
