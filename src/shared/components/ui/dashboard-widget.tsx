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
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
        <div className="min-w-0">
          <h2 className="type-card-title">{title}</h2>
          {description && <p className="type-caption mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("grow px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
