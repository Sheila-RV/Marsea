"use client";

import { useState } from "react";

interface BarDatum {
  label: string;
  tooltipLabel: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  color?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}

// Gráfico de barras de una sola serie, a mano en HTML/CSS: mismo hue en toda
// la barra (no hace falta paleta categórica para una sola serie), tope
// redondeado de 4px, línea base, y un tooltip por barra al pasar el mouse.
// Ver dataviz skill (marks-and-anatomy.md e interaction.md).
export function BarChart({
  data,
  color = "#2a78d6",
  valueFormatter = (value) => String(value),
  height = 160,
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="w-full">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((datum, index) => {
          const barHeight = Math.max(2, (datum.value / maxValue) * (height - 8));
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={`${datum.label}-${index}`}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() =>
                setHoveredIndex((current) => (current === index ? null : current))
              }
              tabIndex={0}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() =>
                setHoveredIndex((current) => (current === index ? null : current))
              }
            >
              {isHovered && (
                <div className="absolute bottom-full z-10 mb-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md">
                  <span className="font-semibold">
                    {valueFormatter(datum.value)}
                  </span>
                  <span className="ml-1.5 opacity-70">{datum.tooltipLabel}</span>
                </div>
              )}
              <div
                className="w-full max-w-6 rounded-t-[4px] outline-none transition-opacity"
                style={{
                  height: barHeight,
                  backgroundColor: color,
                  opacity:
                    hoveredIndex === null || isHovered ? 1 : 0.5,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1 border-t border-border pt-1.5">
        {data.map((datum, index) => (
          <div
            key={`${datum.label}-label-${index}`}
            className="flex-1 text-center text-[10px] text-muted-foreground"
          >
            {datum.label}
          </div>
        ))}
      </div>
    </div>
  );
}
