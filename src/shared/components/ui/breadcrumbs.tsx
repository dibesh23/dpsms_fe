import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { ChevronRightIcon } from "./icons";

export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: ReactNode; href?: string }[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1 text-sm", className)}
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${index}-${String(item.label)}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRightIcon className="size-3.5 flex-none text-neutral-300" />}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="text-neutral-500 transition-colors hover:text-neutral-800 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(last ? "truncate font-medium text-neutral-900" : "text-neutral-500")}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
