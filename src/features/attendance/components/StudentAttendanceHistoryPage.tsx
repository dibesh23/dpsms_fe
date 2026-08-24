"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import {
  studentAttendanceApi,
  type MyAttendanceResponse,
  type MyAttendanceRecord,
  type AttendanceStatus,
} from "../api/studentAttendanceApi";
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "@/shared/components/ui/icons";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

const STATUS_VARIANT: Record<AttendanceStatus, StatusVariant> = {
  PRESENT: "success",
  ABSENT: "danger",
  LATE: "warning",
  EXCUSED: "info",
};

const STATUS_FILTERS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "EXCUSED", label: "Excused" },
];

const EMPTY_RESPONSE: MyAttendanceResponse = {
  enrollmentId: "",
  sectionId: "",
  records: [],
  summary: {
    totalMarked: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0,
  },
  dateRange: { from: "", to: "" },
};

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgoStart(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

const WEEKDAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "short" };

export function StudentAttendanceHistoryPage() {
  const [data, setData] = useState<MyAttendanceResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>(toDateString(daysAgoStart(29)));
  const [toDate, setToDate] = useState<string>(toDateString(daysAgoStart(0)));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(fromDate + "T00:00:00");
      const to = new Date(toDate + "T00:00:00");
      const result = await studentAttendanceApi.getMyAttendance(from, to);
      setData(result);
    } catch {
      setData(EMPTY_RESPONSE);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = data.summary;

  const COLUMNS: Column<MyAttendanceRecord>[] = useMemo(
    () => [
      {
        key: "date",
        header: "Date",
        sortValue: (record) => record.date,
        render: (record) => (
          <div>
            <p className="font-medium text-neutral-900">{formatDate(record.date)}</p>
            <p className="text-xs text-neutral-400">
              {new Date(record.date).toLocaleDateString("en-US", WEEKDAY_FORMAT)}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (record) => record.status,
        render: (record) => (
          <StatusBadge
            status={STATUS_LABEL[record.status]}
            variant={STATUS_VARIANT[record.status]}
          />
        ),
      },
    ],
    [],
  );

  const table = useTable<MyAttendanceRecord>({
    data: data.records,
    pageSize: 10,
    getSearchText: (record) => `${record.date} ${record.status}`,
    filterMatch: (record, value) => record.status === value,
    sortValue: (record, key) => {
      if (key === "status") return record.status;
      return record.date;
    },
    defaultSortKey: "date",
  });

  const filters = useMemo(
    () =>
      STATUS_FILTERS.map((option) => ({
        ...option,
        label: `${option.label} (${data.records.filter((r) => r.status === option.value).length})`,
      })),
    [data.records],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance History"
        description={
          fromDate && toDate
            ? `${formatDate(fromDate)} – ${formatDate(toDate)} · ${summary.totalMarked} days marked`
            : `${summary.totalMarked} days marked`
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard
          label="Overall Attendance"
          value={loading ? "—" : `${summary.attendanceRate}%`}
          icon={<CheckCircle2Icon className="size-4" />}
        />
        <StatsCard
          label="Present Days"
          value={loading ? "—" : String(summary.present)}
          icon={<CalendarDaysIcon className="size-4" />}
        />
        <StatsCard
          label="Absent Days"
          value={loading ? "—" : String(summary.absent)}
          icon={<AlertTriangleIcon className="size-4" />}
        />
        <StatsCard
          label="Late / Excused"
          value={loading ? "—" : String(summary.late + summary.excused)}
          icon={<ClockIcon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="history-from" className="text-sm font-medium text-neutral-700">
              From
            </label>
            <input
              id="history-from"
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="history-to" className="text-sm font-medium text-neutral-700">
              To
            </label>
            <input
              id="history-to"
              type="date"
              value={toDate}
              min={fromDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-100"
            />
          </div>
        </div>
        <FilterDropdown
          label="Filter by status"
          options={filters}
          value={table.filter}
          onChange={table.setFilter}
        />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(record) => record.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No attendance records found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="records"
          />
        }
      />
    </div>
  );
}

export default StudentAttendanceHistoryPage;
