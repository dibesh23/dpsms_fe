"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  studentNoticeApi,
  type MyNoticesResult,
  type NoticeSummary,
} from "../api/studentNoticeApi";

const POLL_INTERVAL_MS = 30_000;

interface Options {
  onNewNotices: (count: number, newNotices: NoticeSummary[]) => void;

  onRefresh: (data: MyNoticesResult) => void;

  enabled?: boolean;
}

export function useNoticePolling({ onNewNotices, onRefresh, enabled = true }: Options) {
  const knownIdsRef = useRef<Set<string> | null>(null);
  const onNewNoticesRef = useRef(onNewNotices);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onNewNoticesRef.current = onNewNotices;
  }, [onNewNotices]);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const poll = useCallback(async () => {
    try {
      const data = await studentNoticeApi.getNotices();

      const sorted = [...data.notices].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
      const sortedData = { ...data, notices: sorted };

      const freshIds = new Set(sorted.map((n) => n.id));

      if (knownIdsRef.current === null) {
        knownIdsRef.current = freshIds;
      } else {
        const newIds = [...freshIds].filter((id) => !knownIdsRef.current!.has(id));
        if (newIds.length > 0) {
          const newNotices = sorted.filter((n) => newIds.includes(n.id));
          onNewNoticesRef.current(newIds.length, newNotices);
        }
        knownIdsRef.current = freshIds;
      }

      onRefreshRef.current(sortedData);
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;

    void poll();

    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, poll]);

  const refresh = useCallback(() => void poll(), [poll]);

  const seed = useCallback((ids: string[]) => {
    knownIdsRef.current = new Set(ids);
  }, []);

  return { refresh, seed };
}
