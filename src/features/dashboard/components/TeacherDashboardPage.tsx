"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_LABELS } from "@/shared/permissions";
import { Avatar } from "@/shared/components/ui/avatar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import {
  ClipboardCheckIcon,
  CheckCircle2Icon,
  LayoutGridIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import {
  dashboardApi,
  type TeacherSummary,
  type TeacherTodayAttendance,
} from "../api/dashboardApi";

const TODAY_ROWS: Array<{
  key: keyof TeacherTodayAttendance;
  label: string;
  dot: string;
  bar: string;
}> = [
  { key: "present", label: "Present", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  { key: "late", label: "Late", dot: "bg-amber-500", bar: "bg-amber-500" },
  { key: "absent", label: "Absent", dot: "bg-red-500", bar: "bg-red-500" },
  { key: "excused", label: "Excused", dot: "bg-blue-500", bar: "bg-blue-500" },
];

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "Teacher";
  const roleLabel = (user?.role && ROLE_LABELS[user.role]) ?? "Teacher";

  const [summary, setSummary] = useState<TeacherSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await dashboardApi.getTeacherSummary();
      setSummary(data);
    } catch {
      setLoadError("We couldn't load your teaching dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Loading your dashboard…" />;
  }

  if (loadError || !summary) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="text-sm font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const todayTotal =
    summary.today.present + summary.today.late + summary.today.absent + summary.today.excused;

  const stats = [
    {
      label: "My Sections",
      value: String(summary.totalSections),
      delta: "Assigned to you",
      href: "/classes",
      icon: <LayoutGridIcon className="size-4" />,
    },
    {
      label: "My Students",
      value: String(summary.totalStudents),
      delta: `${summary.totalSections === 1 ? "Section" : "Sections"} taught`,
      href: "/students",
      icon: <UsersIcon className="size-4" />,
    },
    {
      label: "Present Today",
      value:
        summary.presentTodayPct === null ? "—" : `${summary.presentTodayPct}%`,
      delta:
        summary.today.marked === 0
          ? "Not marked yet"
          : `${summary.today.marked} of ${summary.totalStudents} marked`,
      href: "/attendance/students",
      icon: <CheckCircle2Icon className="size-4" />,
    },
    {
      label: "Marked Today",
      value: String(summary.today.marked),
      delta: "Attendance entries",
      href: "/attendance/students",
      icon: <ClipboardCheckIcon className="size-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Good morning, {firstName}
            </h1>
            <StatusBadge status={roleLabel} variant="info" />
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Your classes, your students — here is how today is shaping up.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {summary.academicYearLabel && (
            <span className="rounded-full border border-neutral-200 bg-bg-default px-3 py-1 text-xs font-medium text-neutral-500">
              Academic Year {summary.academicYearLabel}
            </span>
          )}
          <Avatar name={user?.fullName ?? "Teacher"} size="md" />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            deltaDirection={stat.label === "Present Today" && summary.presentTodayPct !== null && summary.presentTodayPct >= 75 ? "up" : "neutral"}
            href={stat.href}
            icon={stat.icon}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardWidget
          title="Today's Attendance"
          description={
            summary.today.marked === 0
              ? "No registers submitted yet today"
              : `Across your ${summary.totalSections} ${summary.totalSections === 1 ? "section" : "sections"}`
          }
          className="lg:col-span-2"
          action={
            <Link
              href="/attendance/students"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              Take attendance
            </Link>
          }
        >
          {todayTotal === 0 ? (
            <EmptyState
              icon={<ClipboardCheckIcon className="size-5" />}
              title="No attendance recorded yet"
              description="Mark today's register and the results will appear here."
            />
          ) : (
            <ul className="space-y-4">
              {TODAY_ROWS.map((row) => {
                const count = summary.today[row.key];
                const pct = todayTotal === 0 ? 0 : Math.round((count / todayTotal) * 100);
                return (
                  <li key={row.key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-neutral-600">
                        <span className={cn("size-2 rounded-full", row.dot)} />
                        {row.label}
                      </span>
                      <span className="font-medium text-neutral-900">
                        {count}{" "}
                        <span className="text-xs font-normal text-neutral-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
                      <div
                        className={cn("h-full rounded-full transition-all", row.bar)}
                        style={{ width: `${pct}%` }}
                        role="img"
                        aria-label={`${row.label}: ${count} of ${todayTotal}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardWidget>

        <DashboardWidget title="My Sections" description="Classes assigned to you">
          {summary.sections.length === 0 ? (
            <EmptyState
              icon={<LayoutGridIcon className="size-5" />}
              title="No sections assigned"
              description="Ask your principal to assign you to a class."
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {summary.sections.map((section) => (
                <li key={section.sectionId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {section.className} - {section.sectionName}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {section.studentCount}{" "}
                      {section.studentCount === 1 ? "student" : "students"}
                    </p>
                  </div>
                  <Link
                    href="/attendance/students"
                    className="ml-3 flex-none rounded-lg border border-neutral-200 bg-bg-default px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-bg-muted hover:text-neutral-900"
                  >
                    Register
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardWidget>
      </section>
    </div>
  );
}
