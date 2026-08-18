"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/shared/lib/cn";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { Avatar } from "@/shared/components/ui/avatar";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useToast } from "@/shared/components/ui/toast";
import {
  attendanceApi,
  type SectionOption,
  type SectionAttendanceRecord,
  type StudentAttendanceStatus,
} from "../api/attendanceApi";
import {
  CheckCircle2Icon,
  ClipboardCheckIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

const STATUS_OPTIONS: StudentAttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

const STATUS_LABELS: Record<StudentAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

const STATUS_COLORS: Record<StudentAttendanceStatus, string> = {
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ABSENT: "border-red-200 bg-red-50 text-red-700",
  LATE: "border-amber-200 bg-amber-50 text-amber-700",
  EXCUSED: "border-blue-200 bg-blue-50 text-blue-700",
};

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function StudentAttendancePage() {
  const toast = useToast();
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(toDateString(todayStart()));
  const [records, setRecords] = useState<SectionAttendanceRecord[]>([]);
  const [localStatuses, setLocalStatuses] = useState<Map<string, StudentAttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<{
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  } | null>(null);

  const loadSections = useCallback(async () => {
    try {
      const list = await attendanceApi.listSections();
      setSections(list);
      if (list.length > 0 && !selectedSection) {
        setSelectedSection(list[0].id);
      }
    } catch {
      setSections([]);
    }
  }, [selectedSection]);

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const from = new Date(todayStart());
      from.setDate(1);
      const to = todayStart();
      const stats = await attendanceApi.getStudentStats(from, to);
      setOverallStats(stats.summary);
    } catch {
      setOverallStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const loadAttendance = useCallback(async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const dateObj = new Date(selectedDate + "T12:00:00Z");
      const result = await attendanceApi.getSectionAttendance(selectedSection, dateObj);
      setRecords(result.items);
      const map = new Map<string, StudentAttendanceStatus>();
      for (const r of result.items) {
        map.set(r.enrollmentId, r.status);
      }
      setLocalStatuses(map);
    } catch {
      setRecords([]);
      setLocalStatuses(new Map());
    } finally {
      setLoading(false);
    }
  }, [selectedSection, selectedDate]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const updateStatus = (enrollmentId: string, status: StudentAttendanceStatus) => {
    setLocalStatuses((prev) => {
      const next = new Map(prev);
      next.set(enrollmentId, status);
      return next;
    });
  };

  const markAllPresent = () => {
    const next = new Map<string, StudentAttendanceStatus>();
    for (const r of records) {
      next.set(r.enrollmentId, "PRESENT");
    }
    setLocalStatuses(next);
  };

  const hasChanges = records.some((r) => {
    const current = localStatuses.get(r.enrollmentId);
    return current !== undefined && current !== r.status;
  });

  const handleSave = async () => {
    if (!selectedSection) return;
    setSaving(true);
    try {
      const dateObj = new Date(selectedDate + "T12:00:00Z");
      const entries = records.map((r) => ({
        enrollmentId: r.enrollmentId,
        status: localStatuses.get(r.enrollmentId) ?? r.status,
      }));
      await attendanceApi.bulkMarkStudentAttendance({
        sectionId: selectedSection,
        date: dateObj,
        entries,
      });
      toast.success("Attendance saved successfully.");
      await loadAttendance();
      await loadStats();
    } catch {
      toast.error("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel = sections.find((s) => s.id === selectedSection)?.label ?? "Select section";
  const presentCount = records.filter((r) => localStatuses.get(r.enrollmentId) === "PRESENT").length;
  const absentCount = records.filter((r) => localStatuses.get(r.enrollmentId) === "ABSENT").length;
  const lateCount = records.filter((r) => localStatuses.get(r.enrollmentId) === "LATE").length;
  const excusedCount = records.filter((r) => localStatuses.get(r.enrollmentId) === "EXCUSED").length;
  const attendanceRate = records.length > 0 ? Math.round(((presentCount + lateCount) / records.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Student Attendance"
        description={`${formatDateShort(new Date(selectedDate + "T12:00:00Z"))} · ${sectionLabel}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              text="Mark All Present"
              variant="secondary"
              icon={<CheckCircle2Icon className="size-4" />}
              onClick={markAllPresent}
              disabled={loading || records.length === 0}
            />
            <Button
              text="Save"
              loading={saving}
              icon={<ClipboardCheckIcon className="size-4" />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
            />
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="attendance-date" className="text-sm font-medium text-neutral-700">
            Date
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="attendance-section" className="text-sm font-medium text-neutral-700">
            Section
          </label>
          <select
            id="attendance-section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="h-9 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          label="Total Students"
          value={statsLoading ? "—" : String(overallStats?.totalStudents ?? 0)}
          delta={loading ? "Loading…" : `${records.length} in register`}
          deltaDirection="neutral"
          icon={<UsersIcon className="size-4" />}
        />
        <StatsCard
          label="Present Today"
          value={loading ? "—" : String(presentCount)}
          delta={records.length > 0 ? `${attendanceRate}% rate` : "No data"}
          deltaDirection="up"
          icon={<CheckCircle2Icon className="size-4" />}
        />
        <StatsCard
          label="Absent Today"
          value={loading ? "—" : String(absentCount)}
          deltaDirection={absentCount > 0 ? "down" : "neutral"}
          icon={<ClipboardCheckIcon className="size-4" />}
        />
        <StatsCard
          label="Late Today"
          value={loading ? "—" : String(lateCount)}
          deltaDirection={lateCount > 0 ? "down" : "neutral"}
          icon={<CalendarDaysIcon className="size-4" />}
        />
        <StatsCard
          label="Excused Today"
          value={loading ? "—" : String(excusedCount)}
          deltaDirection="neutral"
          icon={<TrendingUpIcon className="size-4" />}
        />
      </section>

      {/* Attendance Table */}
      <DashboardWidget
        title="Attendance Register"
        description={`${records.length} students · Select status for each student`}
      >
        {loading ? (
          <LoadingState label="Loading attendance…" />
        ) : records.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Select a section and date to view attendance."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-4 py-3 text-xs font-medium tracking-wide text-neutral-400">
                    Student
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wide text-neutral-400">
                    Roll No.
                  </th>
                  {STATUS_OPTIONS.map((status) => (
                    <th
                      key={status}
                      className="px-4 py-3 text-center text-xs font-medium tracking-wide text-neutral-400"
                    >
                      {STATUS_LABELS[status]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {records.map((record) => {
                  const current = localStatuses.get(record.enrollmentId) ?? record.status;
                  return (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-bg-muted"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={record.studentName} size="sm" />
                          <span className="font-medium text-neutral-900">{record.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{record.rollNumber}</td>
                      {STATUS_OPTIONS.map((status) => (
                        <td key={status} className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => updateStatus(record.enrollmentId, status)}
                            className={cn(
                              "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-all",
                              current === status
                                ? STATUS_COLORS[status]
                                : "border-neutral-200 bg-bg-default text-neutral-400 hover:border-neutral-300 hover:text-neutral-600",
                            )}
                          >
                            {status.charAt(0)}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardWidget>
    </div>
  );
}
