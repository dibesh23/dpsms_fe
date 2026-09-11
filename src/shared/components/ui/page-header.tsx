import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="type-page-title">{title}</h1>
        {description && <p className="type-body-secondary mt-1">{description}</p>}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 [&>*]:min-w-0 [&>*]:flex-1 sm:w-auto sm:[&>*]:flex-none">
          {actions}
        </div>
      )}
    </div>
  );
}
