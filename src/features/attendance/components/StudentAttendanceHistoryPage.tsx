"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import {
  studentAttendanceApi,
  type AttendanceHistorySummary,
  type AttendanceRecord,
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

const EMPTY_SUMMARY: AttendanceHistorySummary = {
  academicYearLabel: "",
  totalMarkedDays: 0,
  presentDays: 0,
  absentDays: 0,
  lateDays: 0,
  excusedDays: 0,
  overallPercent: 0,
  records: [],
};

const WEEKDAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "short" };

export function StudentAttendanceHistoryPage() {
  const [summary, setSummary] = useState<AttendanceHistorySummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await studentAttendanceApi.getHistory();
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

  const COLUMNS: Column<AttendanceRecord>[] = useMemo(
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
        key: "class",
        header: "Class",
        sortValue: (record) => `${record.className} ${record.sectionName}`,
        render: (record) => (
          <span className="text-neutral-600">
            {record.className}
            {record.sectionName ? ` - ${record.sectionName}` : ""}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (record) => record.status,
        render: (record) => (
          <StatusBadge status={STATUS_LABEL[record.status]} variant={STATUS_VARIANT[record.status]} />
        ),
      },
    ],
    [],
  );

  const table = useTable<AttendanceRecord>({
    data: summary.records,
    pageSize: 10,
    getSearchText: (record) => `${record.date} ${record.className} ${record.sectionName}`,
    filterMatch: (record, value) => record.status === value,
    sortValue: (record, key) => {
      if (key === "status") return record.status;
      if (key === "class") return `${record.className} ${record.sectionName}`;
      return record.date;
    },
    defaultSortKey: "date",
  });

  const filters = useMemo(
    () =>
      STATUS_FILTERS.map((option) => ({
        ...option,
        label: `${option.label} (${summary.records.filter((r) => r.status === option.value).length})`,
      })),
    [summary.records],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance History"
        description={
          summary.academicYearLabel
            ? `Academic Year ${summary.academicYearLabel} · ${summary.totalMarkedDays} days marked`
            : `${summary.totalMarkedDays} days marked`
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard
          label="Overall Attendance"
          value={loading ? "—" : `${summary.overallPercent}%`}
          icon={<CheckCircle2Icon className="size-4" />}
        />
        <StatsCard
          label="Present Days"
          value={loading ? "—" : String(summary.presentDays)}
          icon={<CalendarDaysIcon className="size-4" />}
        />
        <StatsCard
          label="Absent Days"
          value={loading ? "—" : String(summary.absentDays)}
          icon={<AlertTriangleIcon className="size-4" />}
        />
        <StatsCard
          label="Late / Excused"
          value={loading ? "—" : String(summary.lateDays + summary.excusedDays)}
          icon={<ClockIcon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by status"
          options={filters}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search by date or class…"
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