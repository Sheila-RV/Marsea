"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usersApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { GymScopeGuard } from "@/components/gym-scope-guard";
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
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  fullName: z.string().min(2, "Mínimo 2 caracteres").max(100),
});

type FormValues = z.infer<typeof schema>;

export default function UsersPage() {
  const { payload } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [qrUserId, setQrUserId] = useState<string | null>(null);

  const isGymAdmin = payload?.role === "ADMIN";

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.findAll,
    enabled: isGymAdmin,
  });

  const { data: qrData, isLoading: isLoadingQr } = useQuery({
    queryKey: ["user-qr", qrUserId],
    queryFn: () => usersApi.getQrCode(qrUserId as string),
    enabled: !!qrUserId && isGymAdmin,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      toast.success("Miembro creado");
      setCreateOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear",
      );
    },
  });

  if (payload && !isGymAdmin) {
    return <GymScopeGuard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Nuevo miembro
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo miembro</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña inicial</Label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Crear miembro
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personas de tu gimnasio</CardTitle>
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
              Todavía no hay usuarios en este gimnasio.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-16 text-right">QR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.fullName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "secondary" : "outline"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role === "MEMBER" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQrUserId(user.id)}
                        >
                          <QrCode className="h-4 w-4" />
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

      <Dialog open={!!qrUserId} onOpenChange={(open) => !open && setQrUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR del miembro</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {isLoadingQr && <Skeleton className="h-56 w-56 rounded-lg" />}
            {qrData && (
              <div className="rounded-lg bg-white p-3">
                <Image
                  src={qrData.qrImage}
                  alt="Código QR"
                  width={224}
                  height={224}
                  unoptimized
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
