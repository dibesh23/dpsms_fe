import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export type StatusVariant = "success" | "warning" | "danger" | "neutral" | "info";

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-600",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

const DOT_STYLES: Record<StatusVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-neutral-400",
  info: "bg-blue-500",
};

const STATUS_VARIANT: Record<string, StatusVariant> = {
  Active: "success",
  Completed: "success",
  Verified: "success",
  Paid: "success",
  "On Leave": "warning",
  Pending: "warning",
  Upcoming: "info",
  Invited: "info",
  Trial: "info",
  Inactive: "neutral",
  Disabled: "danger",
  Suspended: "danger",
  Resigned: "danger",
  Left: "neutral",
};

export function statusVariant(status: string): StatusVariant {
  return STATUS_VARIANT[status] ?? "neutral";
}

export function StatusBadge({
  status,
  variant,
  dot = true,
  className,
}: {
  status: ReactNode;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
}) {
  const resolved = variant ?? statusVariant(String(status));
  return (
    <span
      className={cn(
        "type-badge inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 whitespace-nowrap",
        VARIANT_STYLES[resolved],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOT_STYLES[resolved])} />}
      {status}
    </span>
  );
}
