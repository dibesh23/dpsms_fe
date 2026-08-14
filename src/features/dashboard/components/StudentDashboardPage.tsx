"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/shared/components/ui/avatar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { DonutChart } from "@/shared/components/ui/charts";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import {
  studentDashboardApi,
  type StudentDashboardSummary,
  type DayAttendanceStatus,
  type NotificationType,
  type InvoiceStatus,
  type SchoolEventCategory,
} from "../api/studentDashboardApi";
import {
  AlertTriangleIcon,
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  GraduationCapIcon,
  MapPinIcon,
  PhoneIcon,
} from "@/shared/components/ui/icons";

const STAT_ICONS: Record<string, React.ReactNode> = {
  "Overall Attendance": <CheckCircle2Icon className="size-4" />,
  "Fee Due": <CreditCardIcon className="size-4" />,
  "Latest Exam": <GraduationCapIcon className="size-4" />,
  Notifications: <BellIcon className="size-4" />,
};

const ATTENDANCE_LABEL: Record<DayAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
  NOT_MARKED: "Not Marked",
};

const ATTENDANCE_VARIANT: Record<DayAttendanceStatus, StatusVariant> = {
  PRESENT: "success",
  ABSENT: "danger",
  LATE: "warning",
  EXCUSED: "info",
  NOT_MARKED: "neutral",
};

const INVOICE_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

const INVOICE_VARIANT: Record<InvoiceStatus, StatusVariant> = {
  DRAFT: "neutral",
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
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

const EMPTY_SUMMARY: StudentDashboardSummary = {
  stats: [],
  profile: {
    fullName: "",
    admissionNumber: "",
    admissionDate: "",
    status: "ACTIVE",
    dateOfBirth: null,
    gender: null,
    bloodGroup: null,
    address: null,
    academicYearLabel: "",
    className: "",
    sectionName: "",
    rollNumber: "",
    guardians: [],
  },
  attendance: {
    overallPercent: 0,
    monthPercent: 0,
    monthLabel: "",
    todayStatus: "NOT_MARKED",
    yesterdayStatus: "NOT_MARKED",
    presentDaysThisMonth: 0,
    lateDaysThisMonth: 0,
    excusedDaysThisMonth: 0,
    absentDaysThisMonth: 0,
  },
  examResults: [],
  fee: {
    totalAnnualFee: 0,
    totalPaid: 0,
    totalDue: 0,
    discounts: [],
    installments: [],
  },
  upcomingEvents: [],
  notifications: [],
};

function attendanceColor(percent: number): string {
  if (percent >= 75) return "#16a34a";
  if (percent >= 50) return "#d97706";
  return "#dc2626";
}

function AttendanceGauge({
  percent,
  label,
  statusBadge,
}: {
  percent: number;
  label: string;
  statusBadge?: React.ReactNode;
}) {
  const color = attendanceColor(percent);
  return (
    <div className="flex flex-col items-center gap-2">
      <DonutChart
        data={[
          { label: "Complete", value: percent, color },
          { label: "Remaining", value: Math.max(100 - percent, 0), color: "#f5f5f5" },
        ]}
        size={132}
        thickness={12}
        centerValue={`${percent}%`}
        centerLabel={label}
      />
      {statusBadge}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="py-2.5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-neutral-800">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

function GuardianRow({
  guardian,
}: {
  guardian: StudentDashboardSummary["profile"]["guardians"][number];
}) {
  const relationLabel =
    guardian.relation === "FATHER"
      ? "Father"
      : guardian.relation === "MOTHER"
        ? "Mother"
        : "Guardian";
  return (
    <li className="py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800">{guardian.fullName}</p>
        {guardian.isPrimary && <StatusBadge status="Primary" variant="info" dot={false} />}
      </div>
      <p className="text-xs text-neutral-500">{relationLabel}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
        <PhoneIcon className="size-3" />
        {guardian.phone}
      </p>
    </li>
  );
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "Student";
  const [summary, setSummary] = useState<StudentDashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await studentDashboardApi.getSummary();
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

  const { profile, attendance, fee } = summary;
  const classLabel = [profile.className, profile.sectionName].filter(Boolean).join(" - ");
  // Only PUBLISHED exam results should ever reach a student; filtering
  // defensively here in case the API ever includes DRAFT/pending ones.
  const publishedResults = summary.examResults.filter((exam) => exam.status === "PUBLISHED");

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Welcome back, {firstName}
            </h1>
            <StatusBadge status="Student" variant="info" />
            {profile.status !== "ACTIVE" && (
              <StatusBadge status={profile.status.replace(/_/g, " ")} variant="warning" />
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Here is your academic summary for today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile.academicYearLabel && (
            <span className="rounded-full border border-neutral-200 bg-bg-default px-3 py-1 text-xs font-medium text-neutral-500">
              Academic Year {profile.academicYearLabel}
            </span>
          )}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-bg-default text-neutral-600 transition-colors hover:bg-bg-muted"
          >
            <BellIcon className="size-4" />
            {summary.notifications.some((n) => !n.isRead) && (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
            )}
          </button>
          <Avatar name={user?.fullName ?? "Student"} size="md" />
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
              <Avatar name={profile.fullName || user?.fullName || "Student"} size="lg" />
              <p className="mt-3 text-base font-semibold text-neutral-900">
                {profile.fullName || user?.fullName}
              </p>
              {classLabel && (
                <p className="mt-1 text-xs text-neutral-500">
                  Class {classLabel}
                  {profile.rollNumber ? ` · Roll ${profile.rollNumber}` : ""}
                </p>
              )}
            </div>

            <dl className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100">
              <ProfileField label="Admission Number" value={profile.admissionNumber} />
              <ProfileField
                label="Date of Admission"
                value={profile.admissionDate ? formatDate(profile.admissionDate) : null}
              />
              <ProfileField label="Class" value={classLabel} />
              <ProfileField label="Roll Number" value={profile.rollNumber} />
              <ProfileField
                label="Date of Birth"
                value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null}
              />
              <ProfileField
                label="Gender"
                value={
                  profile.gender
                    ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()
                    : null
                }
              />
              <ProfileField label="Blood Group" value={profile.bloodGroup} />
              <ProfileField label="Address" value={profile.address} />
            </dl>

            {profile.address && (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-neutral-400">
                <MapPinIcon className="mt-0.5 size-3 flex-none" />
                {profile.address}
              </p>
            )}

            <div className="mt-2 border-t border-neutral-100 pt-1">
              <p className="px-0 pt-3 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                Guardians
              </p>
              {profile.guardians.length === 0 ? (
                <p className="py-3 text-sm text-neutral-400">No guardian on file.</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {profile.guardians.map((guardian) => (
                    <GuardianRow key={guardian.fullName + guardian.relation} guardian={guardian} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="min-w-0 flex-1 space-y-4">
          <DashboardWidget title="Attendance Report" description="Overall and this month">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
                Loading…
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-around gap-6">
                  <AttendanceGauge
                    percent={attendance.overallPercent}
                    label="Overall"
                    statusBadge={
                      <StatusBadge
                        status={ATTENDANCE_LABEL[attendance.todayStatus]}
                        variant={ATTENDANCE_VARIANT[attendance.todayStatus]}
                      />
                    }
                  />
                  <AttendanceGauge
                    percent={attendance.monthPercent}
                    label={attendance.monthLabel || "This month"}
                    statusBadge={
                      <StatusBadge
                        status={ATTENDANCE_LABEL[attendance.yesterdayStatus]}
                        variant={ATTENDANCE_VARIANT[attendance.yesterdayStatus]}
                      />
                    }
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-medium text-emerald-700">Present</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-800">
                      {attendance.presentDaysThisMonth}
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-700">Excused</p>
                    <p className="mt-1 text-xl font-semibold text-blue-800">
                      {attendance.excusedDaysThisMonth}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-700">Late</p>
                    <p className="mt-1 text-xl font-semibold text-amber-800">
                      {attendance.lateDaysThisMonth}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-medium text-red-700">Absent</p>
                    <p className="mt-1 text-xl font-semibold text-red-800">
                      {attendance.absentDaysThisMonth}
                    </p>
                  </div>
                </div>
              </>
            )}
          </DashboardWidget>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardWidget
              title="Exam Results"
              description="Published results, most recent first"
              className="lg:col-span-2"
            >
              {publishedResults.length === 0 ? (
                <EmptyState
                  icon={<GraduationCapIcon className="size-5" />}
                  title="No record found"
                  description="Results appear here once an exam is published."
                />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {publishedResults.map((exam) => (
                    <li key={exam.examId} className="flex items-center gap-3 py-2.5">
                      <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-bg-subtle text-neutral-500">
                        <FileTextIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {exam.examName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {exam.examTypeName}
                          {exam.termName ? ` · ${exam.termName}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          {exam.percentage}%
                        </p>
                        <p className="text-xs text-neutral-400">
                          {exam.totalObtained}/{exam.totalFullMarks}
                        </p>
                      </div>
                      {exam.overallGrade && (
                        <StatusBadge status={exam.overallGrade} variant="neutral" dot={false} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardWidget>

            <DashboardWidget title="Fee Report" description="Payment status">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Total Fee</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {formatCurrency(fee.totalAnnualFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Paid</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {formatCurrency(fee.totalPaid)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Due</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(fee.totalDue)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-900"
                    style={{
                      width: `${
                        fee.totalAnnualFee > 0
                          ? Math.min((fee.totalPaid / fee.totalAnnualFee) * 100, 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {fee.discounts.length > 0 && (
                  <ul className="space-y-1 border-t border-neutral-100 pt-2">
                    {fee.discounts.map((discount) => (
                      <li
                        key={discount.id}
                        className="flex items-center justify-between text-xs text-neutral-500"
                      >
                        <span>{discount.label}</span>
                        <span className="font-medium text-neutral-700">
                          {discount.kind === "SCHOLARSHIP" && discount.scholarshipType === "PERCENTAGE"
                            ? `${discount.percentageOrAmount}% off`
                            : formatCurrency(discount.amount ?? discount.percentageOrAmount ?? 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {fee.installments.length === 0 ? (
                  <EmptyState
                    icon={<CreditCardIcon className="size-5" />}
                    title="No record found"
                    className="py-8"
                  />
                ) : (
                  <ul className="divide-y divide-neutral-100 pt-1">
                    {fee.installments.map((installment) => (
                      <li
                        key={installment.invoiceId}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-neutral-800">
                            {installment.installmentLabel}
                          </p>
                          <p className="text-xs text-neutral-400">
                            Due {formatDate(installment.dueDate)}
                          </p>
                        </div>
                        <StatusBadge
                          status={INVOICE_LABEL[installment.status]}
                          variant={INVOICE_VARIANT[installment.status]}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DashboardWidget>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardWidget
              title="Upcoming Events"
              className="lg:col-span-2"
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
                  {summary.upcomingEvents.map((event) => {
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
                          <span className="text-sm font-semibold leading-none text-neutral-900">
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

            <DashboardWidget
              title="Notifications"
              action={<span className="text-xs font-medium text-blue-600">View all</span>}
            >
              {summary.notifications.length === 0 ? (
                <EmptyState icon={<ClockIcon className="size-5" />} title="You're all caught up" />
              ) : (
                <ul className="space-y-1">
                  {summary.notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="relative flex items-start gap-3 rounded-lg px-0.5 py-2"
                    >
                      {!notification.isRead && (
                        <span className="absolute left-0 top-3.5 size-1.5 rounded-full bg-blue-500" />
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