import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function DashboardWidget({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn("flex flex-col rounded-lg border border-neutral-200 bg-bg-default", className)}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("grow px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
