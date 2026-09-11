"use client";

import { cn } from "@/shared/lib/cn";
import { SearchIcon } from "./icons";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="type-input h-11 w-full rounded-lg border border-neutral-200 bg-bg-default pl-9 pr-3 placeholder:text-content-muted focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100 sm:h-9 sm:w-64"
      />
    </div>
  );
}
