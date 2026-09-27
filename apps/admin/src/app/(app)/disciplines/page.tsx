"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { disciplinesApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { GymScopeGuard } from "@/components/gym-scope-guard";
import type { Discipline } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(50),
  description: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

function DisciplineForm({
  discipline,
  onSubmit,
  isSubmitting,
}: {
  discipline?: Discipline;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: discipline?.name ?? "",
      description: discipline?.description ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Spinning" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          placeholder="Ciclismo indoor de alta intensidad"
          {...register("description")}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {discipline ? "Guardar cambios" : "Crear disciplina"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function DisciplinesPage() {
  const { payload } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Discipline | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["disciplines"],
    queryFn: disciplinesApi.findAll,
    enabled: payload?.role === "ADMIN",
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["disciplines"] });
  }

  function handleError(error: unknown, fallback: string) {
    toast.error(error instanceof ApiError ? error.message : fallback);
  }

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => disciplinesApi.create(values),
    onSuccess: () => {
      toast.success("Disciplina creada");
      setCreateOpen(false);
      invalidate();
    },
    onError: (e) => handleError(e, "No se pudo crear la disciplina"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...values }: { id: string } & FormValues) =>
      disciplinesApi.update(id, values),
    onSuccess: () => {
      toast.success("Disciplina actualizada");
      setEditing(null);
      invalidate();
    },
    onError: (e) => handleError(e, "No se pudo actualizar"),
  });

  const removeMutation = useMutation({
    mutationFn: disciplinesApi.remove,
    onSuccess: () => {
      toast.success("Disciplina eliminada");
      invalidate();
    },
    onError: (e) => handleError(e, "No se pudo eliminar"),
  });

  if (payload && payload.role !== "ADMIN") {
    return <GymScopeGuard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Disciplinas</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Nueva disciplina
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva disciplina</DialogTitle>
            </DialogHeader>
            <DisciplineForm
              onSubmit={(values) => createMutation.mutate(values)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo de tu gimnasio</CardTitle>
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
              Todavía no hay disciplinas. Crea la primera.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((discipline) => (
                  <TableRow key={discipline.id}>
                    <TableCell className="font-medium">
                      {discipline.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {discipline.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={discipline.isActive ? "secondary" : "outline"}
                      >
                        {discipline.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(discipline)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="icon" />}
                          >
                            <Trash2 className="h-4 w-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar &quot;{discipline.name}&quot;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Si la
                                disciplina tiene planes o clases asociadas, el
                                gimnasio te avisará que no se puede borrar.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  removeMutation.mutate(discipline.id)
                                }
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
            <DialogTitle>Editar disciplina</DialogTitle>
          </DialogHeader>
          {editing && (
            <DisciplineForm
              discipline={editing}
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
