"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/shared/components/ui/avatar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { DonutChart } from "@/shared/components/ui/charts";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { RouteLoading } from "@/shared/components/ui/route-loading";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import {
  studentDashboardApi,
  type StudentDashboardSummary,
  type DayAttendancePoint,
  type DayAttendanceStatus,
  type NotificationType,
  type InvoiceStatus,
  type SchoolEventCategory,
} from "../api/studentDashboardApi";
import { DashboardNoticesWidget } from "@/features/notice/components/DashboardNoticesWidget";
import { NoticeBell } from "@/features/notice/components/NoticeBell";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  BanIcon,
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

const MIN_ATTENDANCE_PERCENT = 75;
const NEAR_MIN_ATTENDANCE_BAND = 5;

const TODAY_HERO_STYLES: Record<DayAttendanceStatus, { box: string; icon: string; label: string }> =
  {
    PRESENT: {
      box: "border-emerald-200 bg-emerald-50",
      icon: "bg-bg-default text-emerald-600",
      label: "text-emerald-800",
    },
    ABSENT: {
      box: "border-red-200 bg-red-50",
      icon: "bg-bg-default text-red-600",
      label: "text-red-800",
    },
    LATE: {
      box: "border-amber-200 bg-amber-50",
      icon: "bg-bg-default text-amber-600",
      label: "text-amber-800",
    },
    EXCUSED: {
      box: "border-blue-200 bg-blue-50",
      icon: "bg-bg-default text-blue-600",
      label: "text-blue-800",
    },
    NOT_MARKED: {
      box: "border-neutral-200 bg-bg-subtle",
      icon: "bg-bg-default text-neutral-500",
      label: "text-neutral-700",
    },
  };

const TODAY_ICON: Record<DayAttendanceStatus, React.ReactNode> = {
  PRESENT: <CheckCircle2Icon className="size-5" />,
  ABSENT: <BanIcon className="size-5" />,
  LATE: <ClockIcon className="size-5" />,
  EXCUSED: <FileTextIcon className="size-5" />,
  NOT_MARKED: <CalendarDaysIcon className="size-5" />,
};

const TODAY_TITLE: Record<DayAttendanceStatus, string> = {
  PRESENT: "Marked present today",
  ABSENT: "Marked absent today",
  LATE: "Marked late today",
  EXCUSED: "Absence excused today",
  NOT_MARKED: "Attendance not marked yet",
};

const TODAY_HINT: Record<DayAttendanceStatus, string> = {
  PRESENT: "Your teacher has recorded your attendance for today.",
  ABSENT: "If this doesn't look right, talk to your class teacher.",
  LATE: "You were marked present, but arrived after attendance was taken.",
  EXCUSED: "Today's absence has an approved excuse on record.",
  NOT_MARKED: "This updates as soon as your teacher marks attendance.",
};

const DAY_STRIP_COLORS: Record<DayAttendanceStatus, string> = {
  PRESENT: "bg-emerald-500",
  ABSENT: "bg-red-500",
  LATE: "bg-amber-400",
  EXCUSED: "bg-blue-500",
  NOT_MARKED: "bg-neutral-200",
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
    totalMarkedDays: 0,
    totalMarkedDaysThisMonth: 0,
    recentDays: [],
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

function attendanceRisk(percent: number): {
  tone: "danger" | "warning" | "ok";
  classes: string;
  message: string;
} {
  if (percent < MIN_ATTENDANCE_PERCENT) {
    return {
      tone: "danger",
      classes: "text-red-700",
      message: `Below the ${MIN_ATTENDANCE_PERCENT}% minimum required for exams`,
    };
  }
  if (percent < MIN_ATTENDANCE_PERCENT + NEAR_MIN_ATTENDANCE_BAND) {
    return {
      tone: "warning",
      classes: "text-amber-700",
      message: `Close to the ${MIN_ATTENDANCE_PERCENT}% minimum required for exams`,
    };
  }
  return {
    tone: "ok",
    classes: "text-emerald-700",
    message: `Meets the ${MIN_ATTENDANCE_PERCENT}% minimum required for exams`,
  };
}

function GaugeBlock({
  percent,
  label,
  ariaLabel,
  hasData,
}: {
  percent: number;
  label: string;
  ariaLabel: string;
  hasData: boolean;
}) {
  if (!hasData) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-[132px] flex-col items-center justify-center rounded-full border-2 border-dashed border-neutral-200">
          <p className="text-xs font-medium text-neutral-400">No data yet</p>
        </div>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={ariaLabel}>
      <DonutChart
        data={[
          { label: "Complete", value: percent, color: attendanceColor(percent) },
          { label: "Remaining", value: Math.max(100 - percent, 0), color: "#f5f5f5" },
        ]}
        size={132}
        thickness={12}
        centerValue={`${percent}%`}
        centerLabel={label}
      />
    </div>
  );
}

function DayStrip({ days }: { days: DayAttendancePoint[] }) {
  const tally = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const day of days) {
    if (day.status === "PRESENT") tally.present += 1;
    else if (day.status === "ABSENT") tally.absent += 1;
    else if (day.status === "LATE") tally.late += 1;
    else if (day.status === "EXCUSED") tally.excused += 1;
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-1"
        role="img"
        aria-label={`Last ${days.length} days: ${tally.present} present, ${tally.absent} absent, ${tally.late} late, ${tally.excused} excused`}
      >
        {days.map((day) => {
          const weekday = new Date(`${day.date}T12:00:00Z`).getUTCDay();
          const unmarkedWeekend = day.status === "NOT_MARKED" && (weekday === 0 || weekday === 6);
          return (
            <span
              key={day.date}
              title={`${formatDate(day.date)} — ${
                unmarkedWeekend ? "Weekend" : ATTENDANCE_LABEL[day.status]
              }`}
              className={cn(
                "size-3 rounded-sm",
                unmarkedWeekend
                  ? "border border-neutral-200 bg-neutral-100"
                  : DAY_STRIP_COLORS[day.status],
              )}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((status) => (
          <span
            key={status}
            className="type-micro-label inline-flex items-center gap-1 normal-case"
          >
            <span className={cn("size-2 rounded-sm", DAY_STRIP_COLORS[status])} />
            {ATTENDANCE_LABEL[status]}
          </span>
        ))}
        <span className="type-micro-label inline-flex items-center gap-1 normal-case">
          <span className="size-2 rounded-sm border border-neutral-200 bg-neutral-100" />
          No school
        </span>
      </div>
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await studentDashboardApi.getSummary();
      setSummary(data);
    } catch {
      setSummary(EMPTY_SUMMARY);
      setLoadError("Your dashboard could not be loaded. Check your connection and try again.");
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

  const publishedResults = summary.examResults.filter((exam) => exam.status === "PUBLISHED");
  const hasAttendanceData = attendance.totalMarkedDays > 0;
  const overallRisk = hasAttendanceData ? attendanceRisk(attendance.overallPercent) : null;

  if (loading) return <RouteLoading variant="dashboard" label="Loading student dashboard…" />;
  if (loadError) return <ErrorState description={loadError} onRetry={() => void load()} />;

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-neutral-200 bg-white px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="type-page-title">Welcome back, {firstName}</h1>
            <StatusBadge status="Student" variant="neutral" />
            {profile.status !== "ACTIVE" && (
              <StatusBadge status={profile.status.replace(/_/g, " ")} variant="warning" />
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">Here is your academic summary for today.</p>
        </div>
        <div className="flex items-center gap-2">
          {profile.academicYearLabel && (
            <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-[#064E3B]">
              Academic Year {profile.academicYearLabel}
            </span>
          )}
          <NoticeBell buttonClassName="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-[#064E3B] transition-colors hover:bg-stone-100" />
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
        {}
        <div className="lg:w-72 lg:flex-none">
          <div className="rounded-[18px] border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.02)]">
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

        {}
        <div className="min-w-0 flex-1 space-y-4">
          <DashboardWidget
            title="Attendance Report"
            description="Today, overall trend, and your recent pattern"
            action={
              <Link
                href="/attendance-history"
                className="inline-flex flex-none items-center gap-1 text-xs font-medium text-[#064E3B] transition-colors hover:text-neutral-900"
              >
                View full history
                <ArrowUpRightIcon className="size-3.5" />
              </Link>
            }
          >
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
                Loading…
              </div>
            ) : (
              <div className="space-y-5">
                {}
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4",
                    TODAY_HERO_STYLES[attendance.todayStatus].box,
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 flex-none items-center justify-center rounded-full",
                      TODAY_HERO_STYLES[attendance.todayStatus].icon,
                    )}
                  >
                    {TODAY_ICON[attendance.todayStatus]}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "type-section-title",
                        TODAY_HERO_STYLES[attendance.todayStatus].label,
                      )}
                    >
                      {TODAY_TITLE[attendance.todayStatus]}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {TODAY_HINT[attendance.todayStatus]}
                    </p>
                  </div>
                  <span className="ml-auto hidden flex-none text-xs text-neutral-400 sm:block">
                    {formatDate(new Date())}
                  </span>
                </div>

                {hasAttendanceData ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-around gap-6">
                        <GaugeBlock
                          percent={attendance.overallPercent}
                          label="Overall"
                          ariaLabel={`Overall attendance ${attendance.overallPercent} percent`}
                          hasData
                        />
                        <GaugeBlock
                          percent={attendance.monthPercent}
                          label={attendance.monthLabel || "This month"}
                          ariaLabel={`${attendance.monthLabel || "This month"} attendance ${attendance.monthPercent} percent`}
                          hasData={attendance.totalMarkedDaysThisMonth > 0}
                        />
                      </div>
                      {overallRisk && (
                        <p
                          className={cn(
                            "flex items-center justify-center gap-1.5 text-xs font-medium",
                            overallRisk.classes,
                          )}
                        >
                          {overallRisk.tone !== "ok" && (
                            <AlertTriangleIcon className="size-3.5 flex-none" />
                          )}
                          {overallRisk.message}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-neutral-100 pt-4">
                      <p className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                        Last 30 days
                      </p>
                      <DayStrip days={attendance.recentDays} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-4">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-xs font-medium text-emerald-700">Present</p>
                        <p className="type-kpi-sm mt-1 text-emerald-800">
                          {attendance.presentDaysThisMonth}
                        </p>
                      </div>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-700">Excused</p>
                        <p className="type-kpi-sm mt-1 text-blue-800">
                          {attendance.excusedDaysThisMonth}
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-medium text-amber-700">Late</p>
                        <p className="type-kpi-sm mt-1 text-amber-800">
                          {attendance.lateDaysThisMonth}
                        </p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-medium text-red-700">Absent</p>
                        <p className="type-kpi-sm mt-1 text-red-800">
                          {attendance.absentDaysThisMonth}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={<CalendarDaysIcon className="size-5" />}
                    title="No attendance recorded yet"
                    description="Once your teachers start marking attendance, your percentages, risk status, and daily pattern will appear here."
                  />
                )}
              </div>
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
                        <p className="text-sm font-semibold text-neutral-900">{exam.percentage}%</p>
                        <p className="text-xs text-neutral-400">
                          {exam.totalObtained}/{exam.totalFullMarks}
                        </p>
                      </div>
                      {exam.overallGrade && (
                        <StatusBadge status={exam.overallGrade} variant="neutral" dot={false} />
                      )}
                      {exam.overallGpa != null && (
                        <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-semibold text-neutral-600">
                          GPA {exam.overallGpa}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardWidget>

            <DashboardWidget
              title="Fee Report"
              description="Payment status"
              action={
                <Link
                  href="/fees"
                  className="inline-flex flex-none items-center gap-1 text-xs font-medium text-[#064E3B] transition-colors hover:text-neutral-900"
                >
                  View full details
                  <ArrowUpRightIcon className="size-3.5" />
                </Link>
              }
            >
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
                    className="h-full rounded-full bg-[#064E3B]"
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
                          {discount.kind === "SCHOLARSHIP" &&
                          discount.scholarshipType === "PERCENTAGE"
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
                          <span className="type-numeric text-sm font-semibold leading-4 text-neutral-900">
                            {day}
                          </span>
                          <span className="type-micro-label mt-0.5 normal-case text-neutral-500">
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

            <DashboardNoticesWidget role={user?.role ?? "STUDENT"} limit={5} />
          </section>
        </div>
      </div>
    </div>
  );
}
