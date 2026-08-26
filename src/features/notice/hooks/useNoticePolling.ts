"use client";

import { useCallback, useEffect, useRef } from "react";
import { studentNoticeApi, type MyNoticesResult } from "../api/studentNoticeApi";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

interface Options {
  /** Called when the poll detects new notices since the last fetch */
  onNewNotices: (count: number) => void;
  /** Called every poll cycle with the fresh data so the page can update */
  onRefresh: (data: MyNoticesResult) => void;
  /** Set to false to pause polling (e.g. when tab is hidden) */
  enabled?: boolean;
}

/**
 * Polls GET /notices/me every 30 s.
 * Compares the current set of notice IDs against the last known set.
 * If there are new ones, calls onNewNotices(count) so the caller can
 * show a toast / banner.  Also calls onRefresh on every tick so the
 * list stays current without a full page reload.
 */
export function useNoticePolling({ onNewNotices, onRefresh, enabled = true }: Options) {
  // Keep a stable ref to the latest known notice IDs so the interval
  // closure always sees the current value without needing to re-register.
  const knownIdsRef = useRef<Set<string> | null>(null);
  const onNewNoticesRef = useRef(onNewNotices);
  const onRefreshRef = useRef(onRefresh);

  // Keep callback refs up-to-date without restarting the interval
  useEffect(() => { onNewNoticesRef.current = onNewNotices; }, [onNewNotices]);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const poll = useCallback(async () => {
    try {
      const data = await studentNoticeApi.getNotices();

      // Sort newest publishedAt first — no urgency pinning, matches admin list order
      const sorted = [...data.notices].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      const sortedData = { ...data, notices: sorted };

      const freshIds = new Set(sorted.map((n) => n.id));

      if (knownIdsRef.current === null) {
        knownIdsRef.current = freshIds;
      } else {
        const newCount = [...freshIds].filter((id) => !knownIdsRef.current!.has(id)).length;
        if (newCount > 0) {
          onNewNoticesRef.current(newCount);
        }
        knownIdsRef.current = freshIds;
      }

      onRefreshRef.current(sortedData);
    } catch {
      // Silent failure — network blip should not disrupt the UI
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Run once immediately so the page is fresh on mount
    void poll();

    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, poll]);

  /** Call this to force an immediate refresh (e.g. after acknowledging) */
  const refresh = useCallback(() => void poll(), [poll]);

  /** Call this to seed the initial known IDs without triggering onNewNotices */
  const seed = useCallback((ids: string[]) => {
    knownIdsRef.current = new Set(ids);
  }, []);

  return { refresh, seed };
}
