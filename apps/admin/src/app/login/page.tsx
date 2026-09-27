"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type FormValues = z.infer<typeof schema>;

// Cuentas del seed de desarrollo, para entrar con un clic mientras probamos
// o hacemos demos. Quitar esta lista antes de invitar a un gimnasio real.
const DEMO_ACCOUNTS = [
  {
    label: "Super admin",
    caption: "Toda la plataforma",
    email: "super@gym-management.dev",
    password: "SuperAdmin123!",
  },
  {
    label: "Admin",
    caption: "Iron Gym",
    email: "admin@iron-gym.dev",
    password: "IronAdmin123!",
  },
  {
    label: "Admin",
    caption: "Flex Studio",
    email: "admin@flex-studio.dev",
    password: "FlexAdmin123!",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      router.replace("/");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo iniciar sesión";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: "#B7D1EA" }}
      />

      <Card className="w-full max-w-sm border-border/60 shadow-xl shadow-black/[0.03]">
        <CardHeader className="items-center text-center">
          <Image
            src="/marsea-logo.png"
            alt="MARSEA"
            width={183}
            height={32}
            className="mb-1 h-8 w-auto"
            priority
          />
          <CardDescription>Acceso para staff y administradores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@tu-gimnasio.dev"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              Cuentas de prueba
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onSubmit(account)}
                  className="rounded-lg border border-border bg-secondary/60 px-2 py-2 text-left transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  <p className="truncate text-xs font-medium">
                    {account.label}
                  </p>
                  <p className="truncate text-[0.65rem] text-muted-foreground">
                    {account.caption}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
