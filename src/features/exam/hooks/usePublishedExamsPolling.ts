"use client";

import { useCallback, useEffect, useRef } from "react";
import { examApi, type ExamListItem } from "../api/examApi";

const POLL_INTERVAL_MS = 30_000;

interface Options {
  onNewExams: (exams: ExamListItem[]) => void;

  onRefresh: (exams: ExamListItem[]) => void;

  enabled?: boolean;
}

export function usePublishedExamsPolling({ onNewExams, onRefresh, enabled = true }: Options) {
  const knownIdsRef = useRef<Set<string> | null>(null);
  const onNewExamsRef = useRef(onNewExams);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onNewExamsRef.current = onNewExams;
  }, [onNewExams]);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const poll = useCallback(async () => {
    try {
      const exams = await examApi.listExams({
        status: "PUBLISHED",
        pageSize: 500,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      const freshIds = new Set(exams.map((e) => e.id));

      if (knownIdsRef.current === null) {
        knownIdsRef.current = freshIds;
      } else {
        const newExams = exams.filter((e) => !knownIdsRef.current!.has(e.id));
        if (newExams.length > 0) {
          onNewExamsRef.current(newExams);
        }
        knownIdsRef.current = freshIds;
      }
      onRefreshRef.current(exams);
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
