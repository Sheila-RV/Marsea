"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
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
  CardTitle,
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
    label: "Ana Torres",
    caption: "Iron Gym · solo Spinning",
    email: "member@iron-gym.dev",
    password: "Member123!",
  },
  {
    label: "Bruno Salas",
    caption: "Flex Studio · todas las disciplinas",
    email: "member@flex-studio.dev",
    password: "Member123!",
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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-sidebar p-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: "#B7D1EA", opacity: 0.1 }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/marsea-logo.png"
            alt="MARSEA"
            width={228}
            height={40}
            className="mx-auto h-10 w-auto brightness-0 invert"
            priority
          />
          <p className="mt-2 text-xs uppercase tracking-widest text-[#B7D1EA]/70">
            Clases y bienestar
          </p>
        </div>

        <Card className="rounded-3xl border-white/20 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              Bienvenido de nuevo
            </CardTitle>
            <CardDescription>
              Ingresa tus datos para ver tus clases y reservas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-primary"
                >
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="rounded-xl bg-secondary pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-primary"
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="rounded-xl bg-secondary pl-10"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl py-5"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Iniciar sesión
              </Button>
            </form>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-center text-xs text-muted-foreground">
                Cuentas de prueba
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => onSubmit(account)}
                    className="rounded-xl border border-border bg-secondary/60 px-2.5 py-2 text-left transition-colors hover:bg-secondary disabled:opacity-50"
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
    </div>
  );
}
