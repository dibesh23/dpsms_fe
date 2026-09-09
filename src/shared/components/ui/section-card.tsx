import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function SectionCard({
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
    <section className={cn("rounded-lg border border-neutral-200 bg-bg-default", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="type-card-title">{title}</h2>
          {description && <p className="type-caption mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
