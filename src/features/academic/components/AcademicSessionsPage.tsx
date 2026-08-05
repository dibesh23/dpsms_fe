"use client";

import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { RowActions } from "@/shared/components/ui/row-actions";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import {
  CalendarDaysIcon,
  FileTextIcon,
  PlusIcon,
  UserPlusIcon,
} from "@/shared/components/ui/icons";

export interface AcademicSession {
  id: string;
  name: string;
  term: string;
  start: string;
  end: string;
  students: number;
  status: "Active" | "Upcoming" | "Completed";
}

const SESSIONS: AcademicSession[] = [
  {
    id: "ses-01",
    name: "Academic Year 2082/83",
    term: "Full year",
    start: "2025-04-13",
    end: "2026-04-12",
    students: 1284,
    status: "Active",
  },
  {
    id: "ses-02",
    name: "Term I 2082/83",
    term: "First term",
    start: "2025-04-13",
    end: "2025-08-21",
    students: 1284,
    status: "Active",
  },
  {
    id: "ses-03",
    name: "Term II 2082/83",
    term: "Second term",
    start: "2025-09-01",
    end: "2025-12-26",
    students: 1284,
    status: "Upcoming",
  },
  {
    id: "ses-04",
    name: "Term III 2082/83",
    term: "Third term",
    start: "2026-01-11",
    end: "2026-04-12",
    students: 1284,
    status: "Upcoming",
  },
  {
    id: "ses-05",
    name: "Academic Year 2081/82",
    term: "Full year",
    start: "2024-04-13",
    end: "2025-04-12",
    students: 1221,
    status: "Completed",
  },
  {
    id: "ses-06",
    name: "Academic Year 2080/81",
    term: "Full year",
    start: "2023-04-14",
    end: "2024-04-12",
    students: 1175,
    status: "Completed",
  },
];

const STATUS_FILTERS = [
  { value: "Active", label: "Active" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Completed", label: "Completed" },
];

const COLUMNS: Column<AcademicSession>[] = [
  {
    key: "name",
    header: "Session",
    sortValue: (session) => session.name,
    render: (session) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
          <CalendarDaysIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{session.name}</p>
          <p className="text-xs text-neutral-400">{session.term}</p>
        </div>
      </div>
    ),
  },
  {
    key: "start",
    header: "Start Date",
    sortValue: (session) => session.start,
    render: (session) => <span className="text-neutral-500">{formatDate(session.start)}</span>,
  },
  {
    key: "end",
    header: "End Date",
    sortValue: (session) => session.end,
    render: (session) => <span className="text-neutral-500">{formatDate(session.end)}</span>,
  },
  {
    key: "students",
    header: "Students",
    sortValue: (session) => session.students,
    align: "right",
    render: (session) => (
      <span className="font-medium text-neutral-700">{session.students.toLocaleString()}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortValue: (session) => session.status,
    render: (session) => <StatusBadge status={session.status} />,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: () => (
      <RowActions
        actions={[
          { label: "Open session", icon: <FileTextIcon className="size-3.5" /> },
          { label: "Promote students", icon: <UserPlusIcon className="size-3.5" /> },
        ]}
      />
    ),
  },
];

export function AcademicSessionsPage() {
  const table = useTable<AcademicSession>({
    data: SESSIONS,
    pageSize: 6,
    getSearchText: (session) => `${session.name} ${session.term} ${session.status}`,
    filterMatch: (session, value) => session.status === value,
    sortValue: (session, key) => String(session[key as keyof AcademicSession] ?? ""),
    defaultSortKey: "start",
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Academic Sessions"
        description="Terms and academic years for the school calendar"
        actions={
          <Button text="New Session" icon={<PlusIcon className="size-4" />} className="w-auto" />
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by status"
          options={STATUS_FILTERS}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search sessions…" />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(session) => session.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No sessions found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="sessions"
          />
        }
      />
    </div>
  );
}
