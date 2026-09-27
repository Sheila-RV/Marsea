"use client";

import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayStripProps {
  days: Date[];
  selected: Date;
  onSelect: (day: Date) => void;
  onShiftWeek: (direction: -1 | 1) => void;
}

// Tira horizontal de días para saltar rápido a una fecha, inspirada en el
// selector de calendarios de reserva de clases. "Hoy" siempre se distingue
// del resto aunque no esté seleccionado.
export function DayStrip({ days, selected, onSelect, onShiftWeek }: DayStripProps) {
  const today = new Date();

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => onShiftWeek(-1)}
        aria-label="Semana anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {days.map((day) => {
        const isSelected = isSameDay(day, selected);
        const isToday = isSameDay(day, today);

        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelect(day)}
            className={cn(
              "flex shrink-0 flex-col items-center rounded-lg px-3 py-1.5 text-xs transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <span className="font-medium">
              {isToday ? "Hoy" : format(day, "EEE", { locale: es })}
            </span>
            <span>{format(day, "d")}</span>
          </button>
        );
      })}

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => onShiftWeek(1)}
        aria-label="Semana siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
