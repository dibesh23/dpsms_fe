"use client";

import { useEffect } from "react";
import { cn } from "@/shared/lib/cn";
import { XIcon } from "./icons";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden p-0 sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-neutral-900/40 animate-overlay-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[calc(100dvh-0.5rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-bg-default shadow-xl animate-scale-in sm:my-8 sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg",
          maxWidth,
        )}
      >
        <div className="flex flex-none items-start justify-between gap-4 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="type-modal-title">{title}</h2>
            {description && <p className="type-body-secondary mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-bg-subtle hover:text-neutral-700 sm:h-9 sm:w-9"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>
      </div>
    </div>
  );
}
