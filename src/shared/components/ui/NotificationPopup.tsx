"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/shared/lib/cn";
import { XIcon, AlertTriangleIcon, CheckCircle2Icon, BellIcon } from "@/shared/components/ui/icons";

export type NotificationVariant = "urgent-notice" | "exam-result" | "notice";

interface NotificationItem {
  id: number;
  variant: NotificationVariant;
  title: string;
  message: string;
}

let globalId = 0;
let globalListener: ((item: NotificationItem) => void) | null = null;

export function pushNotification(variant: NotificationVariant, title: string, message: string) {
  globalListener?.({ id: ++globalId, variant, title, message });
}

const VARIANT_STYLES: Record<NotificationVariant, string> = {
  "urgent-notice": "border-red-200 bg-red-50",
  "exam-result": "border-emerald-200 bg-emerald-50",
  notice: "border-blue-200 bg-blue-50",
};

const VARIANT_ICON_COLORS: Record<NotificationVariant, string> = {
  "urgent-notice": "text-red-500",
  "exam-result": "text-emerald-500",
  notice: "text-blue-500",
};

const VARIANT_BORDER_LEFT: Record<NotificationVariant, string> = {
  "urgent-notice": "border-l-4 border-l-red-500",
  "exam-result": "border-l-4 border-l-emerald-500",
  notice: "border-l-4 border-l-blue-500",
};

const DISMISS_MS = 8_000;

export function NotificationPopup() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalListener = (item) => {
      setItems((prev) => [...prev, item]);

      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, DISMISS_MS);
    };
    return () => {
      globalListener = null;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[110] flex flex-col items-center gap-3 px-4 sm:items-end sm:pr-6">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto w-full max-w-sm rounded-lg border bg-bg-default shadow-xl animate-toast-in",
            VARIANT_STYLES[item.variant],
            VARIANT_BORDER_LEFT[item.variant],
          )}
          role="alert"
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <span className={cn("mt-0.5 flex-none", VARIANT_ICON_COLORS[item.variant])}>
              {item.variant === "urgent-notice" ? (
                <AlertTriangleIcon className="size-5" />
              ) : item.variant === "exam-result" ? (
                <CheckCircle2Icon className="size-5" />
              ) : (
                <BellIcon className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
              <p className="mt-0.5 text-sm text-neutral-600">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss"
              className="flex-none rounded text-neutral-400 transition-colors hover:text-neutral-700"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
