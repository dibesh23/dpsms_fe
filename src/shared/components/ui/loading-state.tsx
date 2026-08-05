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
        "flex items-center justify-center gap-2 py-12 text-sm text-neutral-500",
        className,
      )}
      role="status"
    >
      <LoadingSpinner className="size-4 text-neutral-400" />
      {label}
    </div>
  );
}
