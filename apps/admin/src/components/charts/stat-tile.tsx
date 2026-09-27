import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  deltaPct?: number | null;
  deltaCaption?: string;
}

// Insignia de variación: solo aparece cuando el backend pudo calcular un
// porcentaje real contra el período anterior (ver dashboard.service.ts,
// deltaPct). Nunca se inventa un "+15%" de adorno.
function DeltaBadge({ deltaPct, caption }: { deltaPct: number; caption: string }) {
  const isPositive = deltaPct >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
      style={{
        color: isPositive ? "#0ca30c" : "#d03b3b",
        backgroundColor: isPositive
          ? "color-mix(in oklch, #0ca30c 12%, transparent)"
          : "color-mix(in oklch, #d03b3b 12%, transparent)",
      }}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(deltaPct)}%
      <span className="ml-0.5 font-normal text-muted-foreground">{caption}</span>
    </span>
  );
}

export function StatTile({
  label,
  value,
  icon: Icon,
  deltaPct,
  deltaCaption = "vs. periodo anterior",
}: StatTileProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {deltaPct !== undefined && deltaPct !== null && (
            <DeltaBadge deltaPct={deltaPct} caption={deltaCaption} />
          )}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
