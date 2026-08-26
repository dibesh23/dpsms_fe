"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/shared/providers/AuthProvider";
import {
  attendanceApi,
  type RosterEntry,
} from "../api/attendanceApi";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import { AttendanceRegister } from "./AttendanceRegister";

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

function formatDateShort(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StudentAttendancePage() {
  const toast = useToast();
  const { user, isLoading: authLoading } = useAuth();
  // Only teachers mark student attendance; admin/principal get a read-only register.
  const canMark = user?.role === "TEACHER";
  const [sections, setSections] = useState<Array<{ id: string; label: string }>>([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(toDateString(todayStart()));
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
      if (canMark) {
        // Teachers only see the sections they're assigned to.
        const result = await attendanceApi.getMySections();
        const list = result.items.map((s) => ({
          id: s.sectionId,
          label: `${s.className} · ${s.sectionName}`,
        }));
        setSections(list);
        if (list.length > 0) {
          setSelectedSection((prev) => prev || list[0].id);
        } else {
          toast.info(
            "No classes are assigned to you yet. Ask the admin to assign you to a section.",
          );
        }
      } else {
        // Admin/Principal can pick any section in the school.
        const options = await attendanceApi.listSections();
        const list = options.map((s) => ({ id: s.id, label: s.label }));
        setSections(list);
        if (list.length > 0) {
          setSelectedSection((prev) => prev || list[0].id);
        } else {
          toast.info("No sections found. Create classes and sections first.");
        }
      }
    } catch {
      setSections([]);
      setLoadError("Could not load your sections. Please try again.");
      toast.error("Could not load sections.");
    } finally {
      setSectionsLoaded(true);
    }
  }, [canMark, toast]);

  // Wait for auth to resolve before firing any requests — prevents
  // pointless 401s when the session is missing or still being restored.
  useEffect(() => {
    if (authLoading || !user) return;
    void loadSections();
  }, [loadSections, authLoading, user]);

  // Teachers only need their own class's stats; school-wide is for admins.
  const loadStats = useCallback(async () => {
    if (canMark && !selectedSection) {
      if (sectionsLoaded) setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    try {
      const from = new Date(todayStart());
      from.setDate(1);
      const to = todayStart();
      const stats = await attendanceApi.getStudentStats(
        from,
        to,
        canMark && selectedSection ? selectedSection : undefined,
      );
      setOverallStats(stats.summary);
    } catch {
      setOverallStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [canMark, selectedSection, sectionsLoaded]);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadStats();
  }, [loadStats, authLoading, user]);

  const loadRoster = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!selectedSection) {
        if (sectionsLoaded) {
          setLoading(false);
          setRoster([]);
        }
        return;
      }
      if (!options?.silent) setLoading(true);
      try {
        const dateObj = new Date(`${selectedDate}T12:00:00Z`);
        // Full enrolled roster merged with the day's marked status
        // (null = not yet marked) — works on fresh days too.
        const result = await attendanceApi.getSectionRoster(selectedSection, dateObj);
        setRoster(result.items);
        setLoadError(null);
      } catch {
        if (!options?.silent) {
          setRoster([]);
          setLoadError("Could not load this class register. Please try again.");
          toast.error("Could not load the class register.");
        }
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [selectedSection, selectedDate, sectionsLoaded, toast],
  );

  useEffect(() => {
    if (authLoading || !user) return;
    void loadRoster();
  }, [loadRoster, authLoading, user]);

  const sectionLabel = sections.find((s) => s.id === selectedSection)?.label ?? "";
  const noAssignedSections = canMark && sectionsLoaded && sections.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={canMark ? "Student Attendance" : "Class Attendance"}
        description={
          canMark
            ? `${formatDateShort(selectedDate)} · ${sectionLabel}`
            : `Recorded by class teachers · ${formatDateShort(selectedDate)} · ${sectionLabel}`
        }
      />

      {noAssignedSections ? (
        <EmptyState
          icon={<ClipboardCheckIcon className="size-5" />}
          title="No section assigned to you"
          description="You are not assigned to any class section yet. Ask the admin to assign you a section, then you can start marking attendance here."
        />
      ) : (
        <>
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
                className="h-9 max-w-56 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatsCard
              label="Total Students"
              value={statsLoading ? "—" : String(overallStats?.totalStudents ?? 0)}
              delta={loading ? "Loading…" : `${roster.length} in register`}
              deltaDirection="neutral"
              icon={<UsersIcon className="size-4" />}
            />
            <StatsCard
              label="Present Today"
              value={loading ? "—" : String(roster.filter((r) => r.status === "PRESENT").length)}
              delta={statsLoading || !overallStats ? "No data" : `${overallStats.attendanceRate}% rate`}
              deltaDirection="up"
              icon={<CheckCircle2Icon className="size-4" />}
            />
            <StatsCard
              label="Absent Today"
              value={loading ? "—" : String(roster.filter((r) => r.status === "ABSENT").length)}
              deltaDirection={
                roster.some((r) => r.status === "ABSENT") ? "down" : "neutral"
              }
              icon={<ClipboardCheckIcon className="size-4" />}
            />
            <StatsCard
              label="Late Today"
              value={loading ? "—" : String(roster.filter((r) => r.status === "LATE").length)}
              deltaDirection={roster.some((r) => r.status === "LATE") ? "down" : "neutral"}
              icon={<CalendarDaysIcon className="size-4" />}
            />
            <StatsCard
              label="Excused Today"
              value={loading ? "—" : String(roster.filter((r) => r.status === "EXCUSED").length)}
              deltaDirection="neutral"
              icon={<TrendingUpIcon className="size-4" />}
            />
          </section>

          {loadError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertTriangleIcon className="mt-0.5 size-4 flex-none" />
              <span>{loadError}</span>
            </div>
          )}

          {!sectionsLoaded || loading ? (
            <LoadingState label="Loading attendance…" />
          ) : selectedSection ? (
            <AttendanceRegister
              key={`${selectedSection}-${selectedDate}`}
              sectionId={selectedSection}
              sectionLabel={sectionLabel}
              date={selectedDate}
              roster={roster}
              onSaved={() => {
                void loadRoster({ silent: true });
                void loadStats();
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
