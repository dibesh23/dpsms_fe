import { AlertTriangleIcon } from "./icons";
import { Button } from "./button";
import { cn } from "@/shared/lib/cn";

export function ErrorState({
  title = "Unable to load this content",
  description = "Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-[18px] border border-amber-200 bg-amber-50/50 px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-200">
        <AlertTriangleIcon className="size-5" />
      </span>
      <h2 className="type-card-title mt-4">{title}</h2>
      <p className="type-body-secondary mt-2 max-w-md">{description}</p>
      {onRetry && <Button text="Try again" onClick={onRetry} className="mt-5 w-auto px-5" />}
    </div>
  );
}
