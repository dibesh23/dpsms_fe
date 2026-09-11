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
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.02)]",
        className,
      )}
    >
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="type-card-title">{title}</h2>
          {description && <p className="type-caption mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex-none">{action}</div>}
      </div>
      <div className={cn("min-w-0 grow px-4 py-4 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}
