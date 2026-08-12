"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/shared/components/ui/avatar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { BarChart, DonutChart } from "@/shared/components/ui/charts";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { dashboardApi, type DashboardSummary } from "../api/dashboardApi";
import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

const STAT_ICONS: Record<string, React.ReactNode> = {
  "Student Count": <UsersIcon className="size-4" />,
  "Teacher Count": <GraduationCapIcon className="size-4" />,
  "Attendance Today": <CheckCircle2Icon className="size-4" />,
  "Fees Collected (month)": <CreditCardIcon className="size-4" />,
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  admission: <UserPlusIcon className="size-4" />,
  payment: <CreditCardIcon className="size-4" />,
  notice: <BellIcon className="size-4" />,
  teacher: <GraduationCapIcon className="size-4" />,
};

const EMPTY_SUMMARY: DashboardSummary = {
  academicYear: "",
  stats: [],
  attendanceToday: 0,
  weeklyAttendance: [],
  gradeDistribution: [],
  gradeDistributionTotal: 0,
  recentActivities: [],
  upcomingEvents: [],
  recentAdmissions: [],
  notifications: [],
};

const QUICK_ACTIONS = [
  {
    title: "Add Student",
    description: "Enrol a new student",
    href: "/students",
    icon: UserPlusIcon,
  },
  {
    title: "Invite Teacher",
    description: "Send a teacher invite",
    href: "/teachers",
    icon: GraduationCapIcon,
  },
  {
    title: "Register Parent",
    description: "Link a guardian account",
    href: "/parents",
    icon: HeartHandshakeIcon,
  },
  {
    title: "Start New Term",
    description: "Open the 2083/84 session",
    href: "/academic-sessions",
    icon: CalendarDaysIcon,
  },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CALENDAR_EVENTS = new Set([5, 12, 18, 21]);

function buildMonthGrid() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from<null>({ length: firstWeekday }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return {
    year,
    monthName: now.toLocaleDateString("en-GB", { month: "long" }),
    today: now.getDate(),
    cells,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "Principal";
  const calendar = buildMonthGrid();
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = summary.stats.map((stat) => ({
    ...stat,
    icon: STAT_ICONS[stat.label],
  }));

  const academicYearLabel = summary.academicYear || "2082/83";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Good morning, {firstName}
            </h1>
            <StatusBadge status="Principal" variant="info" />
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Here is what is happening at Digital Pathshala today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-neutral-200 bg-bg-default px-3 py-1 text-xs font-medium text-neutral-500">
            Academic Year {academicYearLabel}
          </span>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-bg-default text-neutral-600 transition-colors hover:bg-bg-muted"
          >
            <BellIcon className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
          </button>
          <Avatar name={user?.fullName ?? "Principal"} size="md" />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={loading ? "—" : stat.value}
            delta={loading ? "Loading…" : stat.delta}
            deltaDirection={stat.deltaDirection}
            href={stat.href}
            icon={stat.icon}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardWidget
          title="Attendance Overview"
          description="This week across all classes"
          className="lg:col-span-2"
          action={
            <Link
              href="/classes"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              View all
            </Link>
          }
        >
          <BarChart data={summary.weeklyAttendance} highlightMax />
        </DashboardWidget>

        <DashboardWidget title="Student Distribution" description="By grade">
          <div className="flex items-center gap-6">
            <DonutChart
              data={summary.gradeDistribution}
              centerValue={String(summary.gradeDistributionTotal)}
              centerLabel="Students"
            />
            <ul className="space-y-2">
              {summary.gradeDistribution.map((grade) => (
                <li key={grade.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: grade.color }}
                  />
                  <span className="text-neutral-600">{grade.label}</span>
                  <span className="ml-auto font-medium text-neutral-900">{grade.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </DashboardWidget>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardWidget
          title="Recent Activities"
          description="Latest changes across the school"
          className="lg:col-span-2"
          action={<span className="text-xs text-neutral-400">Last 24 hours</span>}
        >
          <ul className="space-y-1">
            {summary.recentActivities.map((activity) => (
              <li key={activity.title} className="flex items-start gap-3 py-2">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 flex-none items-center justify-center rounded-lg bg-bg-subtle",
                    activity.tone,
                  )}
                >
                  {ACTIVITY_ICONS[activity.type] ?? <BellIcon className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800">{activity.title}</p>
                  <p className="text-xs text-neutral-400">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </DashboardWidget>

        <DashboardWidget title="Upcoming Events">
          <ul className="space-y-3">
            {summary.upcomingEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3">
                <div className="flex size-11 flex-none flex-col items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle">
                  <span className="text-sm font-semibold leading-none text-neutral-900">
                    {event.day}
                  </span>
                  <span className="mt-0.5 text-[10px] leading-none text-neutral-500">
                    {event.month}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">{event.title}</p>
                  <p className="text-xs text-neutral-400">{event.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </DashboardWidget>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-bg-default p-4 transition-colors hover:border-neutral-300"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-600">
                <action.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{action.title}</p>
                <p className="truncate text-xs text-neutral-500">{action.description}</p>
              </div>
            </div>
            <ArrowUpRightIcon className="size-4 flex-none text-neutral-300 transition-colors group-hover:text-neutral-600" />
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardWidget
          title="Recent Admissions"
          action={
            <Link
              href="/students"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-neutral-100">
            {summary.recentAdmissions.map((admission) => (
              <li key={admission.name} className="flex items-center gap-3 py-2.5">
                <Avatar name={admission.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{admission.name}</p>
                  <p className="text-xs text-neutral-500">{admission.grade}</p>
                </div>
                <span className="text-xs text-neutral-400">{admission.date}</span>
              </li>
            ))}
          </ul>
        </DashboardWidget>

        <DashboardWidget
          title={calendar.monthName + " " + calendar.year}
          description="School calendar"
          action={
            <span className="flex items-center gap-1 text-xs text-neutral-400">
              <CalendarDaysIcon className="size-3.5" />
              Today: {calendar.today}
            </span>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="py-1 text-[10px] font-medium tracking-wide text-neutral-400 uppercase"
              >
                {day}
              </span>
            ))}
            {calendar.cells.map((cell, index) => {
              const isToday = cell === calendar.today;
              const hasEvent = cell !== null && CALENDAR_EVENTS.has(cell);
              return (
                <div
                  key={index}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-md text-sm",
                    isToday
                      ? "bg-neutral-900 font-semibold text-white"
                      : cell === null
                        ? "text-transparent"
                        : "text-neutral-700 hover:bg-bg-subtle",
                  )}
                >
                  {cell ?? 0}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-neutral-400" />
                  )}
                </div>
              );
            })}
          </div>
        </DashboardWidget>

        <DashboardWidget
          title="Notifications"
          action={<span className="text-xs font-medium text-blue-600">View all</span>}
        >
          <ul className="space-y-1">
            {summary.notifications.map((notification) => (
              <li
                key={notification.id}
                className="relative flex items-start gap-3 rounded-lg px-0.5 py-2"
              >
                {notification.unread && (
                  <span className="absolute left-0 top-3.5 size-1.5 rounded-full bg-blue-500" />
                )}
                <span
                  className={cn(
                    "ml-2 flex size-7 flex-none items-center justify-center rounded-md",
                    notification.bg,
                    notification.tone,
                  )}
                >
                  <BellIcon className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      notification.unread ? "font-medium text-neutral-800" : "text-neutral-600",
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-neutral-400">{notification.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </DashboardWidget>
      </section>
    </div>
  );
}
