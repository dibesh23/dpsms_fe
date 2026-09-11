import { cn } from "@/shared/lib/cn";
import { LoadingSpinner } from "./icons";

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-3 py-12 text-sm text-neutral-500",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-brand-default">
        <span className="absolute inset-1 rounded-xl border border-emerald-200 motion-safe:animate-pulse" />
        <LoadingSpinner className="relative size-5" />
      </span>
      <span className="font-medium">{label}</span>
    </div>
  );
}
