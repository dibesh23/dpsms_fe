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
  type MarkStatus,
} from "../api/studentDashboardApi";
import {
  BellIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  GraduationCapIcon,
} from "@/shared/components/ui/icons";

const STAT_ICONS: Record<string, React.ReactNode> = {
  "Overall Attendance": <CheckCircle2Icon className="size-4" />,
  "Fee Due": <CreditCardIcon className="size-4" />,
  "Class Tests": <BookOpenIcon className="size-4" />,
  "Upcoming Exams": <GraduationCapIcon className="size-4" />,
};

const MARK_STATUS_LABEL: Record<MarkStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "On Leave",
  NOT_MARKED: "Not Marked",
};

const MARK_STATUS_VARIANT: Record<MarkStatus, StatusVariant> = {
  PRESENT: "success",
  ABSENT: "danger",
  LEAVE: "warning",
  NOT_MARKED: "neutral",
};

const EMPTY_SUMMARY: StudentDashboardSummary = {
  academicYear: "",
  stats: [],
  profile: {
    fullName: "",
    admissionNumber: "",
    admissionDate: "",
    grade: "",
    section: "",
    guardianName: null,
    feeDiscountPercent: 0,
    dateOfBirth: null,
    gender: null,
    bloodGroup: null,
    medicalNotes: null,
    identificationMark: null,
    birthCertificateOrNic: null,
  },
  attendance: {
    overallPercent: 0,
    monthPercent: 0,
    monthLabel: "",
    todayStatus: "NOT_MARKED",
    yesterdayStatus: "NOT_MARKED",
    presentsThisMonth: 0,
    leavesThisMonth: 0,
    absentsThisMonth: 0,
  },
  classTests: [],
  examResults: [],
  fee: {
    totalAnnualFee: 0,
    totalPaid: 0,
    totalDue: 0,
    discountPercent: 0,
    nextDueDate: null,
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

  const academicYearLabel = summary.academicYear || "2082/83";
  const { profile, attendance, fee } = summary;
  const classLabel = [profile.grade, profile.section].filter(Boolean).join(" - ");

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Welcome back, {firstName}
            </h1>
            <StatusBadge status="Student" variant="info" />
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Here is your academic summary for today.
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
            {summary.notifications.some((n) => n.unread) && (
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
                <p className="mt-1 text-xs text-neutral-500">Class {classLabel}</p>
              )}
            </div>

            <dl className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100">
              <ProfileField label="Registration No" value={profile.admissionNumber} />
              <ProfileField
                label="Date of Admission"
                value={profile.admissionDate ? formatDate(profile.admissionDate) : null}
              />
              <ProfileField label="Class" value={classLabel} />
              <ProfileField label="Family / Guardian" value={profile.guardianName} />
              <ProfileField
                label="Discount in Fee"
                value={`${profile.feeDiscountPercent ?? 0}%`}
              />
              <ProfileField
                label="Date of Birth"
                value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null}
              />
              <ProfileField label="Gender" value={profile.gender} />
              <ProfileField label="Blood Group" value={profile.bloodGroup} />
              <ProfileField label="Disease if Any" value={profile.medicalNotes} />
              <ProfileField
                label="Student Birth Form ID / NIC"
                value={profile.birthCertificateOrNic}
              />
            </dl>
          </div>
        </div>

        {/* Reports */}
        <div className="min-w-0 flex-1 space-y-4">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardWidget
              title="Attendance Report"
              description="Overall and this month"
              className="lg:col-span-2"
            >
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
                          status={MARK_STATUS_LABEL[attendance.todayStatus]}
                          variant={MARK_STATUS_VARIANT[attendance.todayStatus]}
                        />
                      }
                    />
                    <AttendanceGauge
                      percent={attendance.monthPercent}
                      label={attendance.monthLabel || "This month"}
                      statusBadge={
                        <StatusBadge
                          status={MARK_STATUS_LABEL[attendance.yesterdayStatus]}
                          variant={MARK_STATUS_VARIANT[attendance.yesterdayStatus]}
                        />
                      }
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-medium text-emerald-700">Presents</p>
                      <p className="mt-1 text-xl font-semibold text-emerald-800">
                        {attendance.presentsThisMonth}
                      </p>
                      <p className="text-[11px] text-emerald-600">This month</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-700">Leaves</p>
                      <p className="mt-1 text-xl font-semibold text-amber-800">
                        {attendance.leavesThisMonth}
                      </p>
                      <p className="text-[11px] text-amber-600">This month</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-medium text-red-700">Absents</p>
                      <p className="mt-1 text-xl font-semibold text-red-800">
                        {attendance.absentsThisMonth}
                      </p>
                      <p className="text-[11px] text-red-600">This month</p>
                    </div>
                  </div>
                </>
              )}
            </DashboardWidget>

            <DashboardWidget title="Examination Report" description="Latest results">
              {summary.examResults.length === 0 ? (
                <EmptyState
                  icon={<GraduationCapIcon className="size-5" />}
                  title="No record found"
                  description="Exam results will appear here once published."
                />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {summary.examResults.map((exam) => (
                    <li key={exam.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-bg-subtle text-neutral-500">
                        <FileTextIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {exam.examName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {exam.term} · {formatDate(exam.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          {exam.percentage}%
                        </p>
                        <StatusBadge
                          status={exam.status}
                          variant={
                            exam.status === "Pass"
                              ? "success"
                              : exam.status === "Fail"
                                ? "danger"
                                : "warning"
                          }
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardWidget>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DashboardWidget
              title="Class Tests Report"
              description="Recent class test scores"
              className="lg:col-span-2"
            >
              {summary.classTests.length === 0 ? (
                <EmptyState
                  icon={<BookOpenIcon className="size-5" />}
                  title="No record found"
                  description="Class test scores will show up here after they are graded."
                />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {summary.classTests.map((test) => (
                    <li key={test.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex size-8 flex-none items-center justify-center rounded-lg bg-bg-subtle text-neutral-500">
                        <BookOpenIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {test.testName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {test.subject} · {formatDate(test.date)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {test.marksObtained}/{test.marksTotal}
                      </span>
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
                        key={installment.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-neutral-800">{installment.label}</p>
                          <p className="text-xs text-neutral-400">
                            Due {formatDate(installment.dueDate)}
                          </p>
                        </div>
                        <StatusBadge
                          status={installment.status}
                          variant={
                            installment.status === "Paid"
                              ? "success"
                              : installment.status === "Overdue"
                                ? "danger"
                                : "warning"
                          }
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
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {event.title}
                        </p>
                        <p className="text-xs text-neutral-400">{event.meta}</p>
                      </div>
                    </li>
                  ))}
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
                            notification.unread
                              ? "font-medium text-neutral-800"
                              : "text-neutral-600",
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-neutral-400">{notification.time}</p>
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