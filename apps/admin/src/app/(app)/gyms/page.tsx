"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { gymsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  adminEmail: z.string().email("Ingresa un email válido"),
  adminPassword: z.string().min(8, "Mínimo 8 caracteres").max(72),
  adminFullName: z.string().min(2, "Mínimo 2 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function GymsPage() {
  const { payload } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["gyms"],
    queryFn: gymsApi.findAll,
    enabled: payload?.role === "SUPER_ADMIN",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: gymsApi.create,
    onSuccess: () => {
      toast.success("Gimnasio creado");
      setCreateOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ["gyms"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear",
      );
    },
  });

  if (payload?.role !== "SUPER_ADMIN") {
    return (
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <ShieldAlert className="h-8 w-8" />
          <p>Esta sección es solo para la super admin de la plataforma.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gimnasios</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Nuevo gimnasio
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo gimnasio</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del gimnasio</Label>
                <Input id="name" placeholder="Iron Gym" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" placeholder="iron-gym" {...register("slug")} />
                {errors.slug && (
                  <p className="text-sm text-destructive">
                    {errors.slug.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminFullName">Nombre del primer admin</Label>
                <Input id="adminFullName" {...register("adminFullName")} />
                {errors.adminFullName && (
                  <p className="text-sm text-destructive">
                    {errors.adminFullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email del admin</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  {...register("adminEmail")}
                />
                {errors.adminEmail && (
                  <p className="text-sm text-destructive">
                    {errors.adminEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Contraseña inicial</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  {...register("adminPassword")}
                />
                {errors.adminPassword && (
                  <p className="text-sm text-destructive">
                    {errors.adminPassword.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Crear gimnasio
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gimnasios en la plataforma</CardTitle>
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
              Todavía no hay gimnasios.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((gym) => (
                  <TableRow key={gym.id}>
                    <TableCell className="font-medium">{gym.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {gym.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={gym.isActive ? "secondary" : "outline"}>
                        {gym.isActive ? "Activo" : "Inactivo"}
                      </Badge>
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
