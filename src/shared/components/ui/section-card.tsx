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
      <div className="flex flex-col items-stretch gap-3 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="type-card-title">{title}</h2>
          {description && <p className="type-caption mt-0.5">{description}</p>}
        </div>
        {action && (
          <div className="flex flex-wrap gap-2 [&>*]:min-w-0 [&>*]:flex-1 sm:[&>*]:flex-none">
            {action}
          </div>
        )}
      </div>
      <div className={cn("px-4 py-4 sm:px-5", bodyClassName)}>{children}</div>
    </section>
  );
}
