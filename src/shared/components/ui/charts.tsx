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
}: {
  data: BarDatum[];
  height?: number;
  highlightMax?: boolean;
}) {
  const max = Math.max(...data.map((datum) => datum.value), 1);
  const maxIndex = data.findIndex((datum) => datum.value === max);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((datum, index) => {
          const isMax = highlightMax && index === maxIndex;
          return (
            <div
              key={datum.label}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <span className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded-md border border-neutral-200 bg-bg-default px-2 py-1 text-xs font-medium text-neutral-700 shadow-sm group-hover:block">
                {datum.valueLabel ?? datum.value}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md transition-all",
                  isMax
                    ? "bg-gradient-to-b from-[#22c55e] to-[#86efac] shadow-[0_8px_24px_rgba(34,197,94,.16)]"
                    : "bg-[#dce9e0] group-hover:bg-[#c9dfcf]",
                )}
                style={{ height: `${(datum.value / max) * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((datum) => (
          <span key={datum.label} className="flex-1 text-center text-xs text-neutral-400">
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
        {data.map((datum) => {
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
            />
          );
          offset += length;
          return element;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerValue && (
          <span className="text-2xl font-semibold tracking-tight text-neutral-900">
            {centerValue}
          </span>
        )}
        {centerLabel && <span className="mt-0.5 text-xs text-neutral-500">{centerLabel}</span>}
      </div>
    </div>
  );
}
