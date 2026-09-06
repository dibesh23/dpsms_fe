"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardNoticesWidget } from "@/features/notice/components/DashboardNoticesWidget";
import { NoticeBell } from "@/features/notice/components/NoticeBell";
import { PERMISSIONS, ROLE_LABELS } from "@/shared/permissions";
import { Avatar } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/cn";
import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  MoreIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import { dashboardApi, type DashboardSummary } from "../api/dashboardApi";

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

const STAT_ICONS: Record<string, ReactNode> = {
  "Student Count": <UsersIcon className="size-4" />,
  "Teacher Count": <GraduationCapIcon className="size-4" />,
  "Attendance Today": <CheckCircle2Icon className="size-4" />,
  "Fees Collected (month)": <CreditCardIcon className="size-4" />,
};

const QUICK_ACTIONS = [
  {
    title: "Add Student",
    description: "Enrol a new student",
    href: "/students",
    icon: UserPlusIcon,
    permission: PERMISSIONS.STUDENT_CREATE,
  },
  {
    title: "Invite Teacher",
    description: "Send a teacher invite",
    href: "/teachers",
    icon: GraduationCapIcon,
    permission: PERMISSIONS.TEACHER_CREATE,
  },
  {
    title: "Register Parent",
    description: "Link a guardian account",
    href: "/parents",
    icon: HeartHandshakeIcon,
    permission: PERMISSIONS.PARENT_CREATE,
  },
  {
    title: "Start New Term",
    description: "Open the 2083/84 session",
    href: "/academic-sessions",
    icon: CalendarDaysIcon,
    permission: PERMISSIONS.ACADEMIC_SESSION_CREATE,
  },
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CALENDAR_EVENTS = new Set([5, 12, 18, 21]);
const DISTRIBUTION_COLORS = [
  "#156d39",
  "#1f914c",
  "#22c55e",
  "#4ade80",
  "#86efac",
  "#a7f3c0",
  "#d1fae0",
];

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
  while (cells.length % 7) cells.push(null);
  return {
    year,
    monthName: now.toLocaleDateString("en-GB", { month: "long" }),
    today: now.getDate(),
    cells,
  };
}

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,.02)]",
        className,
      )}
    >
      <div className="flex min-h-12 items-center justify-between border-b border-neutral-100 px-5">
        <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const calendar = useMemo(buildMonthGrid, []);
  const firstName = user?.fullName?.split(" ")[0] ?? "Principal";
  const roleLabel = (user?.role && ROLE_LABELS[user.role]) ?? "Staff";
  const load = useCallback(async () => {
    try {
      setSummary(await dashboardApi.getSummary());
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const maxAttendance = Math.max(...summary.weeklyAttendance.map((item) => item.value), 1);

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-neutral-200 bg-white px-5 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
              Good morning, {firstName}
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {roleLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Here is what is happening at Digital Pathshala today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-700">
            <CalendarDaysIcon className="size-4" />
            Academic Year {summary.academicYear || "—"}
          </div>
          <NoticeBell />
          <Avatar name={user?.fullName ?? "Principal"} size="md" />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-[18px] border border-neutral-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="flex size-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-800 shadow-sm">
                {STAT_ICONS[stat.label]}
              </span>
              <span>{stat.label}</span>
              {stat.deltaDirection === "up" && (
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                  Active
                </span>
              )}
            </div>
            <p className="mt-5 text-3xl font-medium tracking-tight text-neutral-950">
              {loading ? "—" : stat.value}
            </p>
            <div className="mt-4 flex h-8 items-center justify-between rounded-lg border border-neutral-200 px-3 text-xs text-neutral-500">
              <span>{loading ? "Loading…" : stat.delta}</span>
              <ArrowUpRightIcon className="size-3.5 text-neutral-700" />
            </div>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,1fr)]">
        <Panel
          title="Attendance Overview"
          action={
            <Link
              href="/classes"
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              View all
            </Link>
          }
        >
          <div className="px-5 pb-5 pt-6">
            <div className="relative flex h-64 items-end gap-3 border-b border-neutral-200 bg-[linear-gradient(to_bottom,transparent_24%,#f5f5f5_25%,transparent_26%,transparent_49%,#f5f5f5_50%,transparent_51%,transparent_74%,#f5f5f5_75%,transparent_76%)] px-2">
              {summary.weeklyAttendance.map((item) => {
                const highlighted = item.value === maxAttendance;
                return (
                  <div key={item.label} className="group relative flex h-full flex-1 items-end">
                    <div
                      className={cn(
                        "relative w-full rounded-t-xl",
                        highlighted
                          ? "bg-gradient-to-b from-[#22c55e] to-[#86efac] shadow-[0_8px_30px_rgba(34,197,94,.18)]"
                          : "bg-[repeating-linear-gradient(135deg,#dce9e0_0,#dce9e0_3px,#f3f8f4_3px,#f3f8f4_6px)]",
                      )}
                      style={{ height: `${Math.max((item.value / maxAttendance) * 86, 4)}%` }}
                    >
                      {highlighted && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#156d39] px-2.5 py-1 text-[11px] font-medium text-white">
                          {item.valueLabel}
                        </span>
                      )}
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-neutral-500">
                      {item.label}
                    </span>
                  </div>
                );
              })}
              {!loading && summary.weeklyAttendance.length === 0 && (
                <p className="m-auto text-sm text-neutral-400">No attendance data available</p>
              )}
            </div>
            <div className="h-7" />
          </div>
        </Panel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Panel
            title="Student Distribution"
            action={
              <span className="text-xs text-neutral-400">
                {summary.gradeDistributionTotal} students
              </span>
            }
          >
            <div className="p-5">
              <div className="flex h-9 overflow-hidden rounded-lg bg-neutral-100">
                {summary.gradeDistribution.map((grade, index) => (
                  <div
                    key={grade.label}
                    style={{
                      width: `${(grade.value / Math.max(summary.gradeDistributionTotal, 1)) * 100}%`,
                      backgroundColor: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
                    }}
                    title={`${grade.label}: ${grade.value}`}
                  />
                ))}
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {summary.gradeDistribution.map((grade, index) => (
                  <li
                    key={grade.label}
                    className="flex items-center gap-1.5 text-xs text-neutral-600"
                  >
                    <span
                      className="size-2 rounded-sm"
                      style={{
                        backgroundColor: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
                      }}
                    />
                    {grade.label} <b className="text-neutral-900">{grade.value}</b>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
          <Panel title="Upcoming Events">
            <ul className="divide-y divide-neutral-100 px-4">
              {summary.upcomingEvents.map((event) => (
                <li key={event.id} className="flex items-center gap-3 py-3">
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-full bg-violet-50 text-violet-700">
                    <b className="text-sm leading-none">{event.day}</b>
                    <span className="text-[9px] uppercase">{event.month}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{event.title}</p>
                    <p className="truncate text-xs text-neutral-500">{event.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      <Panel
        title="Recent Activities"
        action={
          <span className="flex items-center gap-2 text-xs text-neutral-400">
            Last 24 hours <MoreIcon className="size-4" />
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {summary.recentActivities.map((activity) => (
                <tr
                  key={`${activity.title}-${activity.createdAt}`}
                  className="hover:bg-neutral-50/60"
                >
                  <td className="px-5 py-3.5 font-medium text-neutral-900">{activity.title}</td>
                  <td className="px-5 py-3.5 capitalize text-neutral-500">{activity.type}</td>
                  <td className="px-5 py-3.5 text-neutral-500">{activity.time}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.filter((action) => can(action.permission)).map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex items-center gap-3 rounded-[18px] border border-neutral-200 bg-white p-4 hover:border-violet-200 hover:shadow-sm"
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700">
              <action.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{action.title}</p>
              <p className="truncate text-xs text-neutral-500">{action.description}</p>
            </div>
            <ArrowUpRightIcon className="ml-auto size-4 text-neutral-400 group-hover:text-violet-600" />
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title="Recent Admissions"
          action={
            <Link href="/students" className="text-xs font-medium text-violet-600">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-neutral-100 px-5">
            {summary.recentAdmissions.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <Avatar name={item.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{item.name}</p>
                  <p className="text-xs text-neutral-500">{item.grade}</p>
                </div>
                <span className="text-xs text-neutral-400">{item.date}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel
          title={`${calendar.monthName} ${calendar.year}`}
          action={<span className="text-xs text-neutral-400">Today: {calendar.today}</span>}
        >
          <div className="grid grid-cols-7 gap-1 p-4 text-center">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1 text-[10px] font-semibold uppercase text-neutral-400">
                {day}
              </span>
            ))}
            {calendar.cells.map((cell, index) => (
              <div
                key={index}
                className={cn(
                  "relative flex h-8 items-center justify-center rounded-lg text-xs",
                  cell === calendar.today
                    ? "bg-violet-600 font-semibold text-white"
                    : cell
                      ? "text-neutral-700 hover:bg-neutral-50"
                      : "text-transparent",
                )}
              >
                {cell ?? 0}
                {cell && CALENDAR_EVENTS.has(cell) && cell !== calendar.today && (
                  <span className="absolute bottom-0.5 size-1 rounded-full bg-violet-400" />
                )}
              </div>
            ))}
          </div>
        </Panel>
        <DashboardNoticesWidget role={user?.role ?? "PRINCIPAL"} limit={5} />
      </section>

      <Panel
        title="Notifications"
        action={<span className="text-xs font-medium text-violet-600">View all</span>}
      >
        <ul className="grid divide-y divide-neutral-100 px-5 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {summary.notifications.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-3 py-3">
              <span
                className={cn(
                  "relative flex size-9 shrink-0 items-center justify-center rounded-full",
                  item.bg,
                  item.tone,
                )}
              >
                <BellIcon className="size-4" />
                {item.unread && (
                  <span className="absolute right-0 top-0 size-2 rounded-full bg-violet-500 ring-2 ring-white" />
                )}
              </span>
              <div>
                <p className={cn("text-sm text-neutral-800", item.unread && "font-semibold")}>
                  {item.title}
                </p>
                <p className="text-xs text-neutral-400">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
