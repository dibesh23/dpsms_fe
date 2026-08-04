import React from "react";

interface BrandMarkProps {
  variant?: "dark" | "light";
}

export function BrandMark({ variant = "dark" }: BrandMarkProps) {
  const onDark = variant === "dark";

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-tight ${
          onDark ? "bg-white text-[#156d39]" : "bg-[#156d39] text-white"
        }`}
      >
        DP
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={`truncate text-base font-bold tracking-tight ${
            onDark ? "text-white" : "text-slate-900"
          }`}
        >
          Digital Pathshala
        </span>
        <span
          className={`hidden text-[10px] font-semibold uppercase tracking-[0.12em] sm:block ${
            onDark ? "text-emerald-100/70" : "text-slate-500"
          }`}
        >
          Making Nepal Digital
        </span>
      </span>
    </div>
  );
}
