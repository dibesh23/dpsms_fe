import { cn } from "@/shared/lib/cn";
import { InboxIcon } from "./icons";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-400">
        {icon ?? <InboxIcon className="size-5" />}
      </div>
      <p className="type-card-title">{title}</p>
      {description && <p className="type-body-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
