"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/shared/components/ui/avatar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { BarChart } from "@/shared/components/ui/charts";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { formatDate } from "@/shared/lib/format";
import {
  teacherDashboardApi,
  type TeacherDashboardSummary,
  type StaffAttendanceStatus,
  type NotificationType,
  type SchoolEventCategory,
  type SectionAttendanceSnapshot,
} from "../api/teacherDashboardApi";
import {
  AlertTriangleIcon,
  BellIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClockIcon,
  LayoutGridIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

const STAT_ICONS: Record<string, React.ReactNode> = {
  "My Sections": <LayoutGridIcon className="size-4" />,
  "My Students": <UsersIcon className="size-4" />,
  "Attendance Today": <ClipboardCheckIcon className="size-4" />,
  "My Attendance (month)": <CheckCircle2Icon className="size-4" />,
};

const TEACHER_STATUS_LABEL: Record<TeacherDashboardSummary["profile"]["status"], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
  INVITED: "Invited",
};

const TEACHER_STATUS_VARIANT: Record<TeacherDashboardSummary["profile"]["status"], StatusVariant> =
  {
    ACTIVE: "success",
    INACTIVE: "neutral",
    ON_LEAVE: "warning",
    INVITED: "info",
  };

const STAFF_ATTENDANCE_LABEL: Record<StaffAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  ON_LEAVE: "On Leave",
};

const STAFF_ATTENDANCE_VARIANT: Record<StaffAttendanceStatus, StatusVariant> = {
  PRESENT: "success",
  ABSENT: "danger",
  ON_LEAVE: "warning",
};

const NOTIFICATION_ICON: Record<NotificationType, React.ReactNode> = {
  ALERT: <AlertTriangleIcon className="size-3.5" />,
  WARNING: <AlertTriangleIcon className="size-3.5" />,
  SUCCESS: <CheckCircle2Icon className="size-3.5" />,
  INFO: <BellIcon className="size-3.5" />,
};

const EVENT_CATEGORY_VARIANT: Record<SchoolEventCategory, StatusVariant> = {
  EXAM: "danger",
  ACADEMIC: "info",
  EXTRA_CURRICULAR: "success",
  HOLIDAY: "warning",
  MEETING: "neutral",
  OTHER: "neutral",
};

const EMPTY_SUMMARY: TeacherDashboardSummary = {
  academicYearLabel: "",
  stats: [],
  profile: {
    fullName: "",
    email: null,
    phone: null,
    status: "ACTIVE",
    departmentName: null,
    employeeCode: null,
    joinedAt: null,
    classesPerWeek: 0,
    subjects: [],
    classTeacherOf: [],
  },
  sectionsToday: [],
  sectionsMonth: [],
  weeklyAttendanceTrend: [],
  ownAttendance: {
    monthLabel: "",
    presentDays: 0,
    absentDays: 0,
    onLeaveDays: 0,
    recentRecords: [],
  },
  upcomingEvents: [],
  notifications: [],
};

function attendanceColor(percent: number): string {
  if (percent >= 75) return "#16a34a";
  if (percent >= 50) return "#d97706";
  return "#dc2626";
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="py-2.5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium break-words text-neutral-800">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function SectionRow({ snapshot }: { snapshot: SectionAttendanceSnapshot }) {
  const marked = snapshot.totalMarked > 0;
  const classLabel = [snapshot.className, snapshot.sectionName].filter(Boolean).join(" ");
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-800">{classLabel}</p>
          <p className="text-xs text-neutral-500">
            {snapshot.totalStudents} student{snapshot.totalStudents === 1 ? "" : "s"}
            {marked && (
              <>
                {" · "}
                <span className="text-emerald-600">{snapshot.present} present</span>
                {snapshot.absent > 0 && (
                  <span className="text-red-500"> · {snapshot.absent} absent</span>
                )}
                {snapshot.late > 0 && (
                  <span className="text-amber-600"> · {snapshot.late} late</span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(snapshot.attendanceRate, 100)}%`,
                  backgroundColor: attendanceColor(snapshot.attendanceRate),
                }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] text-neutral-400">
              {snapshot.attendanceRate}%
            </p>
          </div>
          <StatusBadge
            status={marked ? "Marked" : "Pending"}
            variant={marked ? "success" : "warning"}
          />
        </div>
      </div>
    </li>
  );
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "Teacher";
  const [summary, setSummary] = useState<TeacherDashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await teacherDashboardApi.getSummary();
      setSummary(data ?? EMPTY_SUMMARY);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = (summary.stats ?? []).map((stat) => ({
    ...stat,
    icon: STAT_ICONS[stat.label],
  }));

  const profile = summary.profile ?? EMPTY_SUMMARY.profile;
  const ownAttendance = summary.ownAttendance ?? EMPTY_SUMMARY.ownAttendance;
  const totalMonthDays =
    ownAttendance.presentDays + ownAttendance.absentDays + ownAttendance.onLeaveDays;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Welcome back, {firstName}
            </h1>
            <StatusBadge status="Teacher" variant="info" />
            {profile.status !== "ACTIVE" && (
              <StatusBadge
                status={TEACHER_STATUS_LABEL[profile.status]}
                variant={TEACHER_STATUS_VARIANT[profile.status]}
              />
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">Here is your teaching summary for today.</p>
        </div>
        <div className="flex items-center gap-2">
          {summary.academicYearLabel && (
            <span className="rounded-full border border-neutral-200 bg-bg-default px-3 py-1 text-xs font-medium text-neutral-500">
              Academic Year {summary.academicYearLabel}
            </span>
          )}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-bg-default text-neutral-600 transition-colors hover:bg-bg-muted"
          >
            <BellIcon className="size-4" />
            {(summary.notifications ?? []).some((n) => !n.isRead) && (
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-red-500" />
            )}
          </button>
          <Avatar name={user?.fullName ?? "Teacher"} size="md" />
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

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Profile panel */}
        <div className="lg:w-72 lg:flex-none">
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <div className="flex flex-col items-center text-center">
              <Avatar name={profile.fullName || user?.fullName || "Teacher"} size="lg" />
              <p className="mt-3 text-base font-semibold text-neutral-900">
                {profile.fullName || user?.fullName}
              </p>
              {profile.departmentName && (
                <p className="mt-1 text-xs text-neutral-500">{profile.departmentName}</p>
              )}
              {profile.classTeacherOf.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {profile.classTeacherOf.map((section) => (
                    <StatusBadge
                      key={section.sectionId}
                      status={`Class Teacher · ${[section.className, section.sectionName]
                        .filter(Boolean)
                        .join(" ")}`}
                      variant="info"
                      dot={false}
                    />
                  ))}
                </div>
              )}
            </div>

            <dl className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100">
              <ProfileField label="Employee Code" value={profile.employeeCode} />
              <ProfileField label="Department" value={profile.departmentName} />
              <ProfileField
                label="Joined On"
                value={profile.joinedAt ? formatDate(profile.joinedAt) : null}
              />
              <ProfileField
                label="Classes / Week"
                value={profile.classesPerWeek > 0 ? String(profile.classesPerWeek) : null}
              />
            </dl>

            <div className="space-y-1.5 pt-3">
              {profile.email && (
                <p className="flex items-center gap-1.5 text-xs break-all text-neutral-500">
                  <MailIcon className="size-3 flex-none" />
                  {profile.email}
                </p>
              )}
              {profile.phone && (
                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <PhoneIcon className="size-3 flex-none" />
                  {profile.phone}
                </p>
              )}
              {!profile.email && !profile.phone && (
                <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <MapPinIcon className="size-3 flex-none" />
                  No contact details yet
                </p>
              )}
            </div>

            <div className="mt-3 border-t border-neutral-100 pt-3">
              <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
                Subjects I Teach
              </p>
              {profile.subjects.length === 0 ? (
                <p className="py-3 text-sm text-neutral-400">No subjects assigned yet.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.subjects.map((subject) => (
                    <span
                      key={subject.id}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600"
                    >
                      <BookOpenIcon className="size-3" />
                      {subject.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="min-w-0 flex-1 space-y-4">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardWidget
              title="My Sections Today"
              description="Marking status and attendance at a glance"
              className="lg:col-span-2"
            >
              {summary.sectionsToday.length === 0 ? (
                <EmptyState
                  icon={<LayoutGridIcon className="size-5" />}
                  title="No sections assigned"
                  description="Sections assigned to you will appear here."
                />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {summary.sectionsToday.map((snapshot) => (
                    <SectionRow key={snapshot.sectionId} snapshot={snapshot} />
                  ))}
                </ul>
              )}
            </DashboardWidget>

            <DashboardWidget title="My Attendance" description={ownAttendance.monthLabel}>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-medium text-emerald-700">Present</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-800">
                    {ownAttendance.presentDays}
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-700">Absent</p>
                  <p className="mt-1 text-xl font-semibold text-red-800">
                    {ownAttendance.absentDays}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-700">On Leave</p>
                  <p className="mt-1 text-xl font-semibold text-amber-800">
                    {ownAttendance.onLeaveDays}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                Recent Records
              </p>
              {ownAttendance.recentRecords.length === 0 ? (
                <EmptyState icon={<ClockIcon className="size-5" />} title="No records found" />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {ownAttendance.recentRecords.map((record) => (
                    <li key={record.date} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-700">{formatDate(record.date)}</p>
                        {(record.checkInAt || record.checkOutAt) && (
                          <p className="text-xs text-neutral-400">
                            {record.checkInAt
                              ? new Date(record.checkInAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                            {" – "}
                            {record.checkOutAt
                              ? new Date(record.checkOutAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </p>
                        )}
                      </div>
                      <StatusBadge
                        status={STAFF_ATTENDANCE_LABEL[record.status]}
                        variant={STAFF_ATTENDANCE_VARIANT[record.status]}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {totalMonthDays > 0 && (
                <p className="mt-3 border-t border-neutral-100 pt-2 text-xs text-neutral-400">
                  {ownAttendance.presentDays} of {totalMonthDays} recorded days present
                </p>
              )}
            </DashboardWidget>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardWidget
              title="Weekly Attendance Trend"
              description="Average across my sections"
              className="lg:col-span-2"
            >
              <BarChart data={summary.weeklyAttendanceTrend} highlightMax height={180} />
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(() => {
                  const monthTotal = summary.sectionsMonth.reduce(
                    (sum, s) => ({
                      students: sum.students + s.totalStudents,
                      present: sum.present + s.present,
                      absent: sum.absent + s.absent,
                      late: sum.late + s.late,
                    }),
                    { students: 0, present: 0, absent: 0, late: 0 },
                  );
                  const cells = [
                    { label: "Students", value: monthTotal.students },
                    { label: "Present", value: monthTotal.present, tone: "text-emerald-600" },
                    { label: "Late", value: monthTotal.late, tone: "text-amber-600" },
                    { label: "Absent", value: monthTotal.absent, tone: "text-red-600" },
                  ];
                  return cells.map((cell) => (
                    <div
                      key={cell.label}
                      className="rounded-lg border border-neutral-200 bg-bg-subtle p-3"
                    >
                      <p className="text-xs text-neutral-500">{cell.label} (month)</p>
                      <p
                        className={cn(
                          "mt-1 text-lg font-semibold",
                          cell.tone ?? "text-neutral-900",
                        )}
                      >
                        {cell.value.toLocaleString("en-US")}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </DashboardWidget>

            <DashboardWidget
              title="Upcoming Events"
              action={
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <CalendarDaysIcon className="size-3.5" />
                  School calendar
                </span>
              }
            >
              {summary.upcomingEvents.length === 0 ? (
                <EmptyState
                  icon={<CalendarDaysIcon className="size-5" />}
                  title="No upcoming events"
                />
              ) : (
                <ul className="space-y-3">
                  {summary.upcomingEvents.slice(0, 4).map((event) => {
                    const date = new Date(event.startsAt);
                    const day = Number.isNaN(date.getTime())
                      ? "—"
                      : date.getDate().toString().padStart(2, "0");
                    const month = Number.isNaN(date.getTime())
                      ? ""
                      : date.toLocaleString("en-US", { month: "short" });
                    return (
                      <li key={event.id} className="flex items-center gap-3">
                        <div className="flex size-11 flex-none flex-col items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle">
                          <span className="text-sm leading-none font-semibold text-neutral-900">
                            {day}
                          </span>
                          <span className="mt-0.5 text-[10px] leading-none text-neutral-500">
                            {month}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-800">
                            {event.title}
                          </p>
                          <p className="truncate text-xs text-neutral-400">
                            {event.location ?? "—"}
                          </p>
                        </div>
                        <StatusBadge
                          status={event.category.replace(/_/g, " ")}
                          variant={EVENT_CATEGORY_VARIANT[event.category]}
                          dot={false}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </DashboardWidget>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardWidget
              title="Notifications"
              className="lg:col-span-3"
              action={<span className="text-xs font-medium text-blue-600">View all</span>}
            >
              {summary.notifications.length === 0 ? (
                <EmptyState icon={<BellIcon className="size-5" />} title="You're all caught up" />
              ) : (
                <ul className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
                  {summary.notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="relative flex items-start gap-3 rounded-lg px-0.5 py-2"
                    >
                      {!notification.isRead && (
                        <span className="absolute top-3.5 left-0 size-1.5 rounded-full bg-blue-500" />
                      )}
                      <span
                        className={cn(
                          "ml-2 flex size-7 flex-none items-center justify-center rounded-md border",
                          notification.type === "ALERT" && "border-red-200 bg-red-50 text-red-600",
                          notification.type === "WARNING" &&
                            "border-amber-200 bg-amber-50 text-amber-600",
                          notification.type === "SUCCESS" &&
                            "border-emerald-200 bg-emerald-50 text-emerald-600",
                          notification.type === "INFO" &&
                            "border-blue-200 bg-blue-50 text-blue-600",
                        )}
                      >
                        {NOTIFICATION_ICON[notification.type]}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.isRead
                              ? "font-medium text-neutral-800"
                              : "text-neutral-600",
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardWidget>
          </section>
        </div>
      </div>
    </div>
  );
}
