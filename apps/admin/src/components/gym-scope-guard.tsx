import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Estas secciones son del catálogo de UN gimnasio (disciplinas, planes,
// usuarios, membresías, clases, check-in). La super admin no tiene gymId,
// así que el backend las rechaza a propósito (ver requireGymId en la API).
// Mostramos esto en vez de dejar que las consultas fallen en silencio.
export function GymScopeGuard() {
  return (
    <Card className="max-w-md">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <ShieldAlert className="h-8 w-8" />
        <p>
          Esta sección es del día a día de un gimnasio. Entra con la cuenta de
          un administrador de gimnasio (no la super admin) para verla.
        </p>
      </CardContent>
    </Card>
  );
}
