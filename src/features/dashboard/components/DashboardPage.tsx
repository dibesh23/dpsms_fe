"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/shared/components/ui/avatar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { BarChart, DonutChart } from "@/shared/components/ui/charts";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  FileTextIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

const STATS = [
  {
    label: "Student Count",
    value: "1,284",
    delta: "24 new this term",
    deltaDirection: "up",
    href: "/students",
    icon: <UsersIcon className="size-4" />,
  },
  {
    label: "Teacher Count",
    value: "86",
    delta: "3 new this term",
    deltaDirection: "up",
    href: "/teachers",
    icon: <GraduationCapIcon className="size-4" />,
  },
  {
    label: "Attendance Today",
    value: "94.2%",
    delta: "1.1% vs yesterday",
    deltaDirection: "up",
    href: "/classes",
    icon: <CheckCircle2Icon className="size-4" />,
  },
  {
    label: "Fees Collected (month)",
    value: "Rs 1,482,000",
    delta: "61% of monthly target",
    deltaDirection: "neutral",
    href: "/students",
    icon: <CreditCardIcon className="size-4" />,
  },
] as const;

const WEEKLY_ATTENDANCE = [
  { label: "Mon", value: 91.2, valueLabel: "91.2%" },
  { label: "Tue", value: 93.5, valueLabel: "93.5%" },
  { label: "Wed", value: 94.1, valueLabel: "94.1%" },
  { label: "Thu", value: 92.8, valueLabel: "92.8%" },
  { label: "Fri", value: 94.2, valueLabel: "94.2%" },
  { label: "Sat", value: 88.6, valueLabel: "88.6%" },
  { label: "Sun", value: 89.3, valueLabel: "89.3%" },
];

const DISTRIBUTION = [
  { label: "Grade 6", value: 212, color: "#171717" },
  { label: "Grade 7", value: 198, color: "#525252" },
  { label: "Grade 8", value: 205, color: "#a3a3a3" },
  { label: "Grade 9", value: 186, color: "#d4d4d4" },
  { label: "Grade 10", value: 173, color: "#737373" },
];
const DISTRIBUTION_TOTAL = DISTRIBUTION.reduce((sum, d) => sum + d.value, 0);

const RECENT_ACTIVITIES = [
  {
    icon: UserPlusIcon,
    tone: "text-emerald-600",
    title: "Aarav Sharma was admitted to Grade 7 A",
    time: "2 hours ago",
  },
  {
    icon: FileTextIcon,
    tone: "text-blue-600",
    title: "Term I Mathematics results published",
    time: "4 hours ago",
  },
  {
    icon: CreditCardIcon,
    tone: "text-emerald-600",
    title: "Fee payment of Rs 8,500 received from Sita Rai",
    time: "6 hours ago",
  },
  {
    icon: BellIcon,
    tone: "text-amber-600",
    title: "Notice on Dashain vacation sent to 1,280 guardians",
    time: "Yesterday",
  },
  {
    icon: GraduationCapIcon,
    tone: "text-neutral-500",
    title: "Teacher account for Sunita K.C. activated",
    time: "Yesterday",
  },
] as const;

const UPCOMING_EVENTS = [
  { day: 10, month: "Aug", title: "Term I Exams begin", meta: "Grade 6 – 10" },
  { day: 12, month: "Aug", title: "Science Fair", meta: "School grounds" },
  { day: 18, month: "Aug", title: "Parent–Teacher Meeting", meta: "Main hall, 9:00 AM" },
  { day: 21, month: "Aug", title: "Dashain Vacation starts", meta: "School closed" },
];

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

const RECENT_ADMISSIONS = [
  { name: "Aarav Sharma", grade: "Grade 7 A", date: "Aug 4" },
  { name: "Prativa Maharjan", grade: "Grade 6 B", date: "Aug 3" },
  { name: "Dipesh Adhikari", grade: "Grade 8 A", date: "Aug 2" },
  { name: "Kritika Basnet", grade: "Grade 9 A", date: "Aug 1" },
];

const NOTIFICATIONS = [
  {
    icon: AlertTriangleIcon,
    tone: "text-amber-600",
    bg: "bg-amber-50",
    title: "Attendance below 90% in Grade 8 A",
    time: "1 hour ago",
    unread: true,
  },
  {
    icon: FileTextIcon,
    tone: "text-blue-600",
    bg: "bg-blue-50",
    title: "3 invoices awaiting approval",
    time: "3 hours ago",
    unread: true,
  },
  {
    icon: BellIcon,
    tone: "text-neutral-500",
    bg: "bg-neutral-100",
    title: "New notice published: Dashain vacation",
    time: "Yesterday",
    unread: false,
  },
  {
    icon: CheckCircle2Icon,
    tone: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Term I timetable confirmed",
    time: "2 days ago",
    unread: false,
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
            Academic Year 2082/83
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
        {STATS.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
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
          <BarChart data={WEEKLY_ATTENDANCE} highlightMax />
        </DashboardWidget>

        <DashboardWidget title="Student Distribution" description="By grade">
          <div className="flex items-center gap-6">
            <DonutChart
              data={DISTRIBUTION}
              centerValue={String(DISTRIBUTION_TOTAL)}
              centerLabel="Students"
            />
            <ul className="space-y-2">
              {DISTRIBUTION.map((grade) => (
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
            {RECENT_ACTIVITIES.map((activity) => (
              <li key={activity.title} className="flex items-start gap-3 py-2">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 flex-none items-center justify-center rounded-lg bg-bg-subtle",
                    activity.tone,
                  )}
                >
                  <activity.icon className="size-4" />
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
            {UPCOMING_EVENTS.map((event) => (
              <li key={event.title} className="flex items-center gap-3">
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
            {RECENT_ADMISSIONS.map((admission) => (
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
            {NOTIFICATIONS.map((notification) => (
              <li
                key={notification.title}
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
                  <notification.icon className="size-3.5" />
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
