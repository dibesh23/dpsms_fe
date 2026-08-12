"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import { AddSessionForm, type AddSessionValues } from "./AddSessionForm";
import { academicApi } from "../api/academicApi";
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

const STATUS_FILTERS = [
  { value: "Active", label: "Active" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Completed", label: "Completed" },
];

const toStatus = (isActive: boolean): AcademicSession["status"] =>
  isActive ? "Active" : "Upcoming";

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
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const records = await academicApi.listSessions();
      setSessions(
        records.map((r) => ({
          id: r.id,
          name: r.label,
          term: "",
          start: r.startDate.slice(0, 10),
          end: r.endDate.slice(0, 10),
          students: 0,
          status: toStatus(r.isActive),
        })),
      );
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: AddSessionValues): Promise<boolean> => {
    try {
      const record = await academicApi.createSession({
        label: values.label,
        startDate: values.startDate,
        endDate: values.endDate,
        isActive: true,
      });
      setSessions((current) => [
        {
          id: record.id,
          name: record.label,
          term: "",
          start: record.startDate.slice(0, 10),
          end: record.endDate.slice(0, 10),
          students: 0,
          status: toStatus(record.isActive),
        },
        ...current,
      ]);
      setDialogOpen(false);
      return true;
    } catch {
      return false;
    }
  };

  const table = useTable<AcademicSession>({
    data: sessions,
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
          <Button
            text="New Session"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Session"
        description="Create a new academic session."
      >
        <AddSessionForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
