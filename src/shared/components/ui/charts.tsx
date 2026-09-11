"use client";

import { cn } from "@/shared/lib/cn";

export interface BarDatum {
  label: string;
  value: number;
  valueLabel?: string;
}

export function BarChart({
  data,
  height = 160,
  highlightMax = false,
  emptyLabel = "No data recorded for this period",
}: {
  data: BarDatum[];
  height?: number;
  highlightMax?: boolean;
  emptyLabel?: string;
}) {
  const max = Math.max(...data.map((datum) => datum.value), 1);
  const maxIndex = data.findIndex((datum) => datum.value === max);
  const hasValues = data.some((datum) => datum.value > 0);
  const chartLabel = data
    .map((datum) => `${datum.label}: ${datum.valueLabel ?? datum.value}`)
    .join(", ");

  return (
    <div className="w-full" role="img" aria-label={chartLabel || emptyLabel}>
      <div
        className="relative flex items-end gap-2 border-b border-neutral-200 bg-[linear-gradient(to_bottom,transparent_24%,#f5f5f5_25%,transparent_26%,transparent_49%,#f5f5f5_50%,transparent_51%,transparent_74%,#f5f5f5_75%,transparent_76%)] px-2"
        style={{ height }}
      >
        {data.map((datum, index) => {
          const isMax = hasValues && highlightMax && index === maxIndex;
          const heightPercent = hasValues ? Math.max((datum.value / max) * 92, 4) : 4;
          return (
            <div
              key={datum.label}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <span className="type-badge type-numeric pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded-md border border-neutral-200 bg-bg-default px-2 py-1 text-neutral-700 shadow-sm group-hover:block">
                {datum.valueLabel ?? datum.value}
              </span>
              <div
                className={cn(
                  "chart-bar-enter w-full rounded-t-md transition-colors",
                  isMax
                    ? "bg-[#064E3B] shadow-[0_8px_24px_rgba(6,78,59,.14)]"
                    : "bg-stone-200 group-hover:bg-stone-300",
                )}
                style={{
                  height: `${heightPercent}%`,
                  animationDelay: `${index * 70}ms`,
                }}
              />
            </div>
          );
        })}
        {!hasValues && (
          <span className="type-body-secondary pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
            {emptyLabel}
          </span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((datum) => (
          <span key={datum.label} className="type-caption flex-1 text-center">
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 20,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-neutral-100"
        />
        {data.map((datum, index) => {
          const length = (datum.value / total) * circumference;
          const element = (
            <circle
              key={datum.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={datum.color}
              strokeWidth={thickness}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="chart-donut-enter"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          );
          offset += length;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerValue && <span className="type-kpi">{centerValue}</span>}
        {centerLabel && <span className="type-kpi-label mt-0.5">{centerLabel}</span>}
      </div>
    </div>
  );
}
