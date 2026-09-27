"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { gymsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { GymScopeGuard } from "@/components/gym-scope-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  logoUrl: z.union([z.literal(""), z.string().url("Ingresa una URL válida")]),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { payload } = useAuth();
  const isGymAdmin = payload?.role === "ADMIN";
  const queryClient = useQueryClient();

  const { data: gym, isLoading } = useQuery({
    queryKey: ["gym-mine"],
    queryFn: gymsApi.getMine,
    enabled: isGymAdmin,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", logoUrl: "" },
  });

  useEffect(() => {
    if (gym) {
      reset({
        name: gym.name,
        logoUrl: gym.logoUrl ?? "",
      });
    }
  }, [gym, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      gymsApi.updateMine({
        name: values.name,
        logoUrl: values.logoUrl || undefined,
      }),
    onSuccess: () => {
      toast.success("Gimnasio actualizado");
      void queryClient.invalidateQueries({ queryKey: ["gym-mine"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo actualizar",
      );
    },
  });

  const logoUrl = watch("logoUrl");

  if (payload && !isGymAdmin) {
    return <GymScopeGuard />;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuración del gimnasio</h1>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marca</CardTitle>
            <CardDescription>
              El logo se muestra a tus miembros en la app. Por ahora se
              configura pegando una URL de imagen (sin subida de archivos
              todavía).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => updateMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del gimnasio</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://..."
                  {...register("logoUrl")}
                />
                {errors.logoUrl && (
                  <p className="text-sm text-destructive">
                    {errors.logoUrl.message}
                  </p>
                )}
                {logoUrl && (
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- URL arbitraria pegada por el admin: next/image exigiría declarar cada dominio posible de antemano en next.config.ts */}
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={updateMutation.isPending}>
                Guardar cambios
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
