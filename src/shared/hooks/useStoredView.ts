"use client";

import { useEffect, useState } from "react";

const VIEWS = ["classes", "all"] as const;
type StoredView = (typeof VIEWS)[number];

export function useStoredView(key: string, fallback: StoredView) {
  const [view, setView] = useState<StoredView>(() => {
    if (typeof window === "undefined") return fallback;
    const stored = window.sessionStorage.getItem(key);
    return VIEWS.includes(stored as StoredView) ? (stored as StoredView) : fallback;
  });

  useEffect(() => {
    window.sessionStorage.setItem(key, view);
  }, [key, view]);

  return [view, setView] as const;
}
