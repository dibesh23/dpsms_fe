import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { ArrowDownRightIcon, TrendingUpIcon } from "./icons";
import type { ReactNode } from "react";

export function StatsCard({
  label,
  value,
  delta,
  deltaDirection = "up",
  icon,
  href,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  icon?: ReactNode;
  href?: string;
}) {
  const body = (
    <div className="group flex items-start justify-between gap-3 rounded-[18px] border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.02)] transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm">
      <div className="min-w-0">
        <p className="type-kpi-label">{label}</p>
        <p className="type-kpi mt-2">{value}</p>
        {delta && (
          <p
            className={cn(
              "type-badge mt-1 flex items-center gap-1",
              deltaDirection === "up" && "text-emerald-600",
              deltaDirection === "down" && "text-red-600",
              deltaDirection === "neutral" && "text-neutral-500",
            )}
          >
            {deltaDirection === "up" && <TrendingUpIcon className="size-3" />}
            {deltaDirection === "down" && <ArrowDownRightIcon className="size-3" />}
            {delta}
          </p>
        )}
      </div>
      {icon && (
        <div className="flex size-9 flex-none items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-[#064E3B]">
          {icon}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
