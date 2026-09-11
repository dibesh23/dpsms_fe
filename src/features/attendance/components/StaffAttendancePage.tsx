"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { Avatar } from "@/shared/components/ui/avatar";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { useToast } from "@/shared/components/ui/toast";
import {
  attendanceApi,
  type StaffRosterEntry,
  type StaffAttendanceStatus,
} from "../api/attendanceApi";
import {
  CheckCircle2Icon,
  ClipboardCheckIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  GraduationCapIcon,
} from "@/shared/components/ui/icons";

const PRIMARY_STATUSES = ["PRESENT", "ABSENT", "ON_LEAVE"] as const;

const STATUS_LABELS: Record<StaffAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  ON_LEAVE: "On Leave",
};

const SEGMENT_ACTIVE_COLORS: Record<(typeof PRIMARY_STATUSES)[number], string> = {
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ABSENT: "border-red-200 bg-red-50 text-red-700",
  ON_LEAVE: "border-amber-200 bg-amber-50 text-amber-700",
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

export function StaffAttendancePage() {
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(toDateString(todayStart()));
  const [records, setRecords] = useState<StaffRosterEntry[]>([]);
  const [localStatuses, setLocalStatuses] = useState<Map<string, StaffAttendanceStatus>>(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<{
    totalTeachers: number;
    present: number;
    absent: number;
    onLeave: number;
    attendanceRate: number;
  } | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const from = new Date(todayStart());
      from.setDate(1);
      const to = todayStart();
      const stats = await attendanceApi.getStaffStats(from, to);
      setOverallStats(stats);
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
    setLoading(true);
    try {
      const dateObj = new Date(selectedDate + "T12:00:00Z");

      const result = await attendanceApi.getStaffRoster(dateObj);
      setRecords(result.items);
      const map = new Map<string, StaffAttendanceStatus>();
      for (const r of result.items) {
        map.set(r.teacherId, r.status ?? "PRESENT");
      }
      setLocalStatuses(map);
    } catch {
      setRecords([]);
      setLocalStatuses(new Map());
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  const updateStatus = (teacherId: string, status: StaffAttendanceStatus) => {
    setLocalStatuses((prev) => {
      const next = new Map(prev);
      next.set(teacherId, status);
      return next;
    });
  };

  const markAllPresent = () => {
    const next = new Map<string, StaffAttendanceStatus>();
    for (const r of records) {
      next.set(r.teacherId, "PRESENT");
    }
    setLocalStatuses(next);
  };

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((r) => r.teacherName.toLowerCase().includes(query));
  }, [records, search]);

  const hasChanges = records.some((r) => {
    const current = localStatuses.get(r.teacherId);
    return current !== undefined && current !== (r.status ?? "PRESENT");
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateObj = new Date(selectedDate + "T12:00:00Z");
      const entries = records.map((r) => ({
        teacherId: r.teacherId,
        status: localStatuses.get(r.teacherId) ?? r.status ?? "PRESENT",
      }));
      await attendanceApi.bulkMarkStaffAttendance({ date: dateObj, entries });
      toast.success("Staff attendance saved successfully.");
      await loadAttendance();
      await loadStats();
    } catch {
      toast.error("Failed to save staff attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter((r) => localStatuses.get(r.teacherId) === "PRESENT").length;
  const absentCount = records.filter((r) => localStatuses.get(r.teacherId) === "ABSENT").length;
  const onLeaveCount = records.filter((r) => localStatuses.get(r.teacherId) === "ON_LEAVE").length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff Attendance"
        description={`${formatDateShort(new Date(selectedDate + "T12:00:00Z"))} · All staff members`}
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
              text={saving ? "Saving…" : "Save"}
              loading={saving}
              icon={<ClipboardCheckIcon className="size-4" />}
              onClick={handleSave}
              disabled={!hasChanges || saving}
            />
          </div>
        }
      />

      {}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="staff-attendance-date" className="text-sm font-medium text-neutral-700">
            Date
          </label>
          <input
            id="staff-attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
          />
        </div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search teachers…"
          className="sm:w-64"
        />
      </div>

      {}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          label="Total Staff"
          value={statsLoading ? "—" : String(overallStats?.totalTeachers ?? 0)}
          delta={loading ? "Loading…" : `${records.length} shown today`}
          deltaDirection="neutral"
          icon={<GraduationCapIcon className="size-4" />}
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
          label="On Leave"
          value={loading ? "—" : String(onLeaveCount)}
          deltaDirection="neutral"
          icon={<CalendarDaysIcon className="size-4" />}
        />
        <StatsCard
          label="Attendance Rate"
          value={statsLoading ? "—" : `${overallStats?.attendanceRate ?? 0}%`}
          delta="This month"
          deltaDirection="up"
          icon={<TrendingUpIcon className="size-4" />}
        />
      </section>

      {}
      <DashboardWidget
        title="Staff Attendance Register"
        description={`${records.length} staff members · Defaults to Present — only mark the exceptions`}
      >
        {loading ? (
          <LoadingState label="Loading attendance…" />
        ) : records.length === 0 ? (
          <EmptyState title="No staff members found" description="No active teachers to display." />
        ) : filteredRecords.length === 0 ? (
          <EmptyState title="No matches" description={`No teachers match "${search.trim()}".`} />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="py-2.5 pr-4 text-xs font-medium tracking-wide text-neutral-400">
                    Teacher
                  </th>
                  <th className="py-2.5 text-right text-xs font-medium tracking-wide text-neutral-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRecords.map((record) => {
                  const current = localStatuses.get(record.teacherId) ?? "PRESENT";
                  return (
                    <tr key={record.teacherId} className="transition-colors hover:bg-bg-muted">
                      <td className="py-2 pr-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar name={record.teacherName} size="sm" />
                          <span className="font-medium text-neutral-900">{record.teacherName}</span>
                        </div>
                      </td>
                      <td className="py-2 align-middle">
                        <div className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-bg-default p-0.5">
                          {PRIMARY_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              aria-pressed={current === status}
                              onClick={() => updateStatus(record.teacherId, status)}
                              disabled={saving}
                              className={cn(
                                "inline-flex h-8 items-center justify-center rounded-md border border-transparent px-3 text-xs font-medium transition-all",
                                current === status
                                  ? SEGMENT_ACTIVE_COLORS[status]
                                  : "text-neutral-400 hover:bg-bg-subtle hover:text-neutral-700",
                                saving && "cursor-not-allowed opacity-60",
                              )}
                            >
                              {STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      </td>
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
