"use client";

import { useCallback, useEffect, useRef } from "react";
import { studentExamApi, type ExamResultSummary } from "../api/studentExamApi";

const POLL_INTERVAL_MS = 30_000;

interface Options {
  /** Called when the poll detects new exam results since the last fetch */
  onNewResults: (newResults: ExamResultSummary[]) => void;
  /** Called every poll cycle with the fresh data so the page can update */
  onRefresh: (data: ExamResultSummary[]) => void;
  /** Set false to pause polling */
  enabled?: boolean;
}

/**
 * Polls GET /students/me/exam-results every 30 s.
 * Compares the current set of exam IDs against the last known set.
 * If there are new ones, calls onNewResults with the new result summaries.
 */
export function useExamPolling({ onNewResults, onRefresh, enabled = true }: Options) {
  const knownIdsRef = useRef<Set<string> | null>(null);
  const onNewResultsRef = useRef(onNewResults);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => { onNewResultsRef.current = onNewResults; }, [onNewResults]);
  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const poll = useCallback(async () => {
    try {
      const summary = await studentExamApi.getResults();
      const published = summary.results.filter((r) => r.status === "PUBLISHED");
      const freshIds = new Set(published.map((r) => r.examId));

      if (knownIdsRef.current === null) {
        knownIdsRef.current = freshIds;
      } else {
        const newResults = published.filter((r) => !knownIdsRef.current!.has(r.examId));
        if (newResults.length > 0) {
          onNewResultsRef.current(newResults);
        }
        knownIdsRef.current = freshIds;
      }
      onRefreshRef.current(published);
    } catch {
      // Silent failure
    }
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
