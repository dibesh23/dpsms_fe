"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { Dropdown, DropdownMenuItem } from "@/shared/components/ui/dropdown";
import { useToast } from "@/shared/components/ui/toast";
import {
  attendanceApi,
  type RosterEntry,
  type StudentAttendanceStatus,
} from "../api/attendanceApi";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClipboardCheckIcon,
  MoreIcon,
} from "@/shared/components/ui/icons";

const PRIMARY_STATUSES = ["PRESENT", "ABSENT", "LATE"] as const;

const STATUS_LABELS: Record<StudentAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

const SEGMENT_ACTIVE_COLORS: Record<(typeof PRIMARY_STATUSES)[number], string> = {
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ABSENT: "border-red-200 bg-red-50 text-red-700",
  LATE: "border-amber-200 bg-amber-50 text-amber-700",
};

const COUNT_DOT_COLORS: Record<StudentAttendanceStatus, string> = {
  PRESENT: "bg-emerald-500",
  ABSENT: "bg-red-500",
  LATE: "bg-amber-500",
  EXCUSED: "bg-blue-500",
};

function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export interface AttendanceRegisterProps {
  sectionId: string;
  sectionLabel?: string;
  date: string;
  roster: RosterEntry[];
  onSaved?: () => void;
}

export function AttendanceRegister({
  sectionId,
  sectionLabel,
  date,
  roster,
  onSaved,
}: AttendanceRegisterProps) {
  const toast = useToast();
  const [statuses, setStatuses] = useState<Map<string, StudentAttendanceStatus>>(new Map());
  const baselineRef = useRef<Map<string, StudentAttendanceStatus>>(new Map());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const next = new Map<string, StudentAttendanceStatus>();
    const baseline = new Map<string, StudentAttendanceStatus>();
    for (const entry of roster) {
      const status = entry.status ?? "PRESENT";
      next.set(entry.enrollmentId, status);
      baseline.set(entry.enrollmentId, status);
    }
    baselineRef.current = baseline;
    setStatuses(next);
    setSaveError(null);
  }, [roster]);

  const updateStatus = (enrollmentId: string, status: StudentAttendanceStatus) => {
    setStatuses((prev) => {
      const next = new Map(prev);
      next.set(enrollmentId, status);
      return next;
    });
  };

  const markAllPresent = () => {
    const next = new Map<string, StudentAttendanceStatus>();
    for (const entry of roster) {
      next.set(entry.enrollmentId, "PRESENT");
    }
    setStatuses(next);
  };

  const filteredRoster = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roster;
    return roster.filter(
      (entry) =>
        entry.studentName.toLowerCase().includes(query) ||
        entry.rollNumber.toLowerCase().includes(query),
    );
  }, [roster, search]);

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    for (const entry of roster) {
      const status = statuses.get(entry.enrollmentId);
      if (status === "PRESENT") present += 1;
      else if (status === "ABSENT") absent += 1;
      else if (status === "LATE") late += 1;
      else if (status === "EXCUSED") excused += 1;
    }
    return { present, absent, late, excused };
  }, [roster, statuses]);

  const hasChanges = roster.some((entry) => {
    const current = statuses.get(entry.enrollmentId);
    return current !== undefined && current !== baselineRef.current.get(entry.enrollmentId);
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await attendanceApi.bulkMarkStudentAttendance({
        sectionId,
        date: parseDate(date),
        entries: roster.map((entry) => ({
          enrollmentId: entry.enrollmentId,
          status: statuses.get(entry.enrollmentId) ?? "PRESENT",
        })),
      });
      const saved = new Map(baselineRef.current);
      for (const [enrollmentId, status] of statuses) {
        saved.set(enrollmentId, status);
      }
      baselineRef.current = saved;
      toast.success("Attendance saved successfully.");
      onSaved?.();
    } catch (err) {
      const message =
        err instanceof Error && "response" in err
          ? ((err.response as { data?: { error?: { message?: string } } }).data?.error?.message ??
            "Failed to save attendance.")
          : "Failed to save attendance.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardWidget
      title="Attendance Register"
      description={`${sectionLabel ? `${sectionLabel} · ` : ""}${roster.length} students · Defaults to Present — only mark the exceptions`}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            text="Mark All Present"
            variant="secondary"
            icon={<CheckCircle2Icon className="size-4" />}
            onClick={markAllPresent}
            disabled={saving || roster.length === 0}
          />
          <Button
            text={saving ? "Saving…" : "Save Attendance"}
            loading={saving}
            icon={<ClipboardCheckIcon className="size-4" />}
            onClick={handleSave}
            disabled={!hasChanges || saving || roster.length === 0}
          />
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or roll no…"
            className="w-full sm:w-64"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", COUNT_DOT_COLORS.PRESENT)} />
              Present {counts.present}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", COUNT_DOT_COLORS.ABSENT)} />
              Absent {counts.absent}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", COUNT_DOT_COLORS.LATE)} />
              Late {counts.late}
            </span>
            {counts.excused > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", COUNT_DOT_COLORS.EXCUSED)} />
                Excused {counts.excused}
              </span>
            )}
          </div>
        </div>

        {saveError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertTriangleIcon className="mt-0.5 size-4 flex-none" />
            <span>{saveError}</span>
          </div>
        )}

        {roster.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No students are enrolled in this section yet."
          />
        ) : filteredRoster.length === 0 ? (
          <EmptyState title="No matches" description={`No students match "${search.trim()}".`} />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="py-2.5 pr-4 text-xs font-medium tracking-wide text-neutral-400">
                    Roll No.
                  </th>
                  <th className="py-2.5 pr-4 text-xs font-medium tracking-wide text-neutral-400">
                    Student
                  </th>
                  <th className="py-2.5 text-right text-xs font-medium tracking-wide text-neutral-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRoster.map((entry) => {
                  const current = statuses.get(entry.enrollmentId) ?? entry.status ?? "PRESENT";
                  return (
                    <tr key={entry.enrollmentId} className="transition-colors hover:bg-bg-muted">
                      <td className="py-2 pr-4 align-middle text-neutral-500">
                        {entry.rollNumber}
                      </td>
                      <td className="py-2 pr-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar name={entry.studentName} size="sm" />
                          <span className="font-medium text-neutral-900">{entry.studentName}</span>
                        </div>
                      </td>
                      <td className="py-2 align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-bg-default p-0.5">
                            {PRIMARY_STATUSES.map((status) => (
                              <button
                                key={status}
                                type="button"
                                aria-pressed={current === status}
                                onClick={() => updateStatus(entry.enrollmentId, status)}
                                className={cn(
                                  "inline-flex h-8 min-w-16 items-center justify-center rounded-md border border-transparent px-2.5 text-xs font-medium transition-all",
                                  current === status
                                    ? SEGMENT_ACTIVE_COLORS[status]
                                    : "text-neutral-400 hover:bg-bg-subtle hover:text-neutral-700",
                                  saving && "cursor-not-allowed opacity-60",
                                )}
                                disabled={saving}
                              >
                                {STATUS_LABELS[status]}
                              </button>
                            ))}
                          </div>
                          {current === "EXCUSED" && (
                            <span className="inline-flex h-8 shrink-0 items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-medium text-blue-700">
                              Excused
                            </span>
                          )}
                          <Dropdown
                            width="w-40"
                            trigger={({ toggle }) => (
                              <button
                                type="button"
                                aria-label={`More status options for ${entry.studentName}`}
                                onClick={toggle}
                                disabled={saving}
                                className={cn(
                                  "inline-flex h-8 w-8 flex-none items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-subtle hover:text-neutral-700",
                                  saving && "cursor-not-allowed opacity-60",
                                )}
                              >
                                <MoreIcon className="size-4" />
                              </button>
                            )}
                          >
                            {({ close }) => (
                              <DropdownMenuItem
                                onClick={() => {
                                  updateStatus(
                                    entry.enrollmentId,
                                    current === "EXCUSED" ? "PRESENT" : "EXCUSED",
                                  );
                                  close();
                                }}
                              >
                                {current === "EXCUSED" ? (
                                  <>
                                    <CheckIcon className="size-3.5" />
                                    Back to Present
                                  </>
                                ) : (
                                  <>
                                    <CheckIcon className="size-3.5" />
                                    Mark excused
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
}

export default AttendanceRegister;
