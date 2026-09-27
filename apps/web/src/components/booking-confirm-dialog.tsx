"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassSession } from "@/types/api";

interface BookingConfirmDialogProps {
  session: ClassSession | null;
  planName?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
}

// Vitrina de una futura pasarela de pagos. Las clases en este proyecto están
// incluidas en el plan mensual (no se cobran una a una), así que el "Total"
// muestra la cobertura del plan en vez de inventar un precio por clase. Los
// campos de tarjeta quedan deshabilitados a propósito: todavía no cobran nada
// real, son la base visual para cuando se conecte Stripe de verdad.
export function BookingConfirmDialog({
  session,
  planName,
  onConfirm,
  onOpenChange,
  isSubmitting,
}: BookingConfirmDialogProps) {
  return (
    <Dialog open={!!session} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Confirmar tu reserva
          </DialogTitle>
        </DialogHeader>

        {session && (
          <div className="space-y-4">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-sm font-semibold">{session.disciplineName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {format(new Date(session.startsAt), "EEEE d 'de' MMMM, HH:mm", {
                  locale: es,
                })}{" "}
                · {session.instructorName}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-success">
                Cubierto por tu plan{planName ? ` (${planName})` : ""}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-input bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">
                Próximamente: pagos por clases sueltas o upgrades de plan. Por
                ahora esto no realiza ningún cargo.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">¿Cómo vas a pagar?</Label>
                <Select defaultValue="stripe" disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Número de tarjeta</Label>
                <Input placeholder="1234 1234 1234 1234" disabled />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Vencimiento</Label>
                  <Input placeholder="MM/AA" disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CVC</Label>
                  <Input placeholder="123" disabled />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox disabled />
                Guardar mis datos de pago para compras futuras
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Reservando..." : "Confirmar reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
