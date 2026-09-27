"use client";

import { useState } from "react";

interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: DonutDatum[];
  centerLabel: string;
  centerValue: string;
}

// Paleta categórica en orden fijo (nunca se reordena ni se cicla), tal como
// exige la guía de dataviz para identidad de series: azul, naranja, aqua,
// amarillo. Con hasta 4 planes activos alcanza sin repetir color.
const SLICE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

const RADIUS = 15.9155; // hace que la circunferencia sea ~100, cómodo para %
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DonutSegment extends DonutDatum {
  pct: number;
  dashArray: string;
  dashOffset: number;
  color: string;
}

// Función pura de módulo (no vive dentro del componente) para calcular la
// suma acumulada de cada segmento sin mutar variables durante el render.
function computeSegments(data: DonutDatum[], total: number): DonutSegment[] {
  const segments: DonutSegment[] = [];
  let cumulativePct = 0;

  for (const [index, datum] of data.entries()) {
    const pct = (datum.value / total) * 100;
    segments.push({
      ...datum,
      pct,
      dashArray: `${(pct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      dashOffset: -((cumulativePct / 100) * CIRCUMFERENCE),
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    });
    cumulativePct += pct;
  }

  return segments;
}

export function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Todavía no hay membresías activas para mostrar.
      </p>
    );
  }

  const segments = computeSegments(data, total);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth="4"
          />
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx="18"
              cy="18"
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth="4"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
              className="cursor-pointer transition-opacity"
              style={{
                opacity:
                  hoveredIndex === null || hoveredIndex === index ? 1 : 0.4,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() =>
                setHoveredIndex((current) => (current === index ? null : current))
              }
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">
            {hoveredIndex !== null
              ? segments[hoveredIndex].value
              : centerValue}
          </span>
          <span className="text-xs text-muted-foreground">
            {hoveredIndex !== null ? segments[hoveredIndex].label : centerLabel}
          </span>
        </div>
      </div>

      <ul className="space-y-1.5 text-sm">
        {segments.map((segment, index) => (
          <li
            key={segment.label}
            className="flex cursor-pointer items-center gap-2"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() =>
              setHoveredIndex((current) => (current === index ? null : current))
            }
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
