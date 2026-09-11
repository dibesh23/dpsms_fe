"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { timetableApi, type TimetableCellSource } from "../api/timetableApi";
import { WeeklyTimetableGrid, type TimetableCell } from "./WeeklyTimetableGrid";

function toCells(rows: TimetableCellSource[]): TimetableCell[] {
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    periodNumber: r.periodNumber,
    startTime: r.startTime,
    endTime: r.endTime,
    subjectName: r.subjectName,
    teacherName: r.teacherName ?? null,
    className: r.className,
    timetableName: r.timetableName,
    isBreak: r.isBreak,
  }));
}

export function MyTimetablePage() {
  const toast = useToast();
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";

  const [cells, setCells] = useState<TimetableCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ className?: string; academicYear?: string }>({});

  const load = useCallback(async () => {
    try {
      if (isStudent) {
        const rows = await timetableApi.getMyStudentTimetable();
        setCells(toCells(rows));
        setMeta({
          className: rows[0]?.className,
          academicYear: rows[0]?.academicYearLabel,
        });
      } else {
        const rows = await timetableApi.getMyTeacherTimetable();
        setCells(toCells(rows));
      }
    } catch (err) {
      toast.error(
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response: { data?: { error?: { message?: string } } } }).response.data?.error
              ?.message
          : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [isStudent, toast]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  if (loading) return <LoadingState label="Loading your timetable..." />;

  const description = isStudent
    ? meta.className
      ? `${meta.className} · ${meta.academicYear}`
      : "Your class timetable"
    : "Your weekly timetable across all classes you teach";

  return (
    <div className="space-y-4">
      <PageHeader title="My Timetable" description={description} />

      {cells.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          No timetable is available yet. Check back once your school publishes a timetable.
        </div>
      ) : (
        <WeeklyTimetableGrid slots={cells} />
      )}
    </div>
  );
}
