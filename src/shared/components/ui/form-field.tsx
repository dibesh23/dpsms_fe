import { cn } from "@/shared/lib/cn";
import { forwardRef } from "react";
import type { ReactNode } from "react";

export function Field({
  label,
  error,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm text-red-600" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-sm text-neutral-400">{hint}</span>
      ) : null}
    </label>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-md border border-neutral-300 bg-bg-default px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500",
      className,
    )}
    {...props}
  />
));

Select.displayName = "Select";

export { Select };
