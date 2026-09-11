"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function Dropdown({
  trigger,
  children,
  align = "end",
  width = "w-48",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: "start" | "end";
  width?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((current) => !current), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={ref} className="relative inline-block max-w-full">
      {trigger({ open, toggle })}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 origin-top rounded-lg border border-neutral-200 bg-bg-default p-1 shadow-lg animate-scale-in",
            align === "end" ? "right-0" : "left-0",
            "max-w-[calc(100vw-1.5rem)]",
            width,
            className,
          )}
          role="menu"
        >
          {children({ close })}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  className,
  children,
}: {
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-bg-subtle sm:min-h-0 sm:px-2 sm:py-1.5",
        className,
      )}
    >
      {children}
    </button>
  );
}
