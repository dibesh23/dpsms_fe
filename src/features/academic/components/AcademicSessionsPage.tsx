"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { AddSessionForm, type AddSessionValues } from "./AddSessionForm";
import { academicApi } from "../api/academicApi";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
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
  isActive: boolean;
  status: "Active" | "Upcoming" | "Completed";
}

const STATUS_FILTERS = [
  { value: "Active", label: "Active" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Completed", label: "Completed" },
];

const toStatus = (isActive: boolean): AcademicSession["status"] =>
  isActive ? "Active" : "Upcoming";

const COLUMNS = ({
  canUpdate,
  activatingId,
  onSetActive,
  onPromoteStudents,
}: {
  canUpdate: boolean;
  activatingId: string | null;
  onSetActive: (session: AcademicSession) => void;
  onPromoteStudents: (session: AcademicSession) => void;
}): Column<AcademicSession>[] => [
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
    key: "isActive",
    header: "Active",
    render: (session) => (
      <button
        type="button"
        role="switch"
        aria-checked={session.isActive}
        aria-label={`Set ${session.name} as active academic year`}
        disabled={!canUpdate || session.isActive || activatingId === session.id}
        onClick={() => onSetActive(session)}
        title={
          session.isActive
            ? "Currently active academic year"
            : canUpdate
              ? "Set as active"
              : "You do not have permission to change this"
        }
        className={cn(
          "relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors",
          session.isActive ? "bg-emerald-500" : "bg-neutral-300 hover:bg-neutral-400",
          (!canUpdate || session.isActive) && "cursor-default",
          !canUpdate && "opacity-50",
          activatingId === session.id && "cursor-wait opacity-60",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow transition-transform",
            session.isActive ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
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
    render: (session) => (
      <RowActions
        actions={[
          {
            label: "Promote students",
            icon: <UserPlusIcon className="size-3.5" />,
            onClick: () => onPromoteStudents(session),
          },
          ...(canUpdate && !session.isActive
            ? [
                {
                  label:
                    activatingId === session.id ? "Setting active…" : "Set active",
                  icon: <CheckCircle2Icon className="size-3.5" />,
                  onClick: () => onSetActive(session),
                },
              ]
            : []),
        ]}
      />
    ),
  },
];

export function AcademicSessionsPage() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.ACADEMIC_SESSION_CREATE);
  const canUpdate = can(PERMISSIONS.ACADEMIC_SESSION_UPDATE);

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
          isActive: r.isActive,
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

  const handleSetActive = useCallback(
    async (session: AcademicSession) => {
      if (session.isActive || activatingId) return;
      setActivatingId(session.id);
      try {
        const record = await academicApi.updateSession(session.id, { isActive: true });
        setSessions((current) =>
          current.map((s) => {
            const nowActive = s.id === record.id;
            return { ...s, isActive: nowActive, status: toStatus(nowActive) };
          }),
        );
        toast.success(`"${record.label}" is now the active academic year.`);
      } catch {
        toast.error("Could not set the academic year active. Please try again.");
      } finally {
        setActivatingId(null);
      }
    },
    [activatingId, toast],
  );

  const handlePromoteStudents = useCallback(
    (session: AcademicSession) => {
      if (!session.isActive) {
        toast.error(
          `"${session.name}" is not the active academic year. Set it active first.`,
        );
        return;
      }
      router.push("/students?add=1");
    },
    [router, toast],
  );

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
          isActive: record.isActive,
          status: toStatus(record.isActive),
        },
        ...current.map((s) => {
          if (!record.isActive) return s;
          return { ...s, isActive: false, status: toStatus(false) };
        }),
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
          canCreate ? (
            <Button
              text="New Session"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
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
        columns={COLUMNS({
          canUpdate,
          activatingId,
          onSetActive: (s) => void handleSetActive(s),
          onPromoteStudents: handlePromoteStudents,
        })}
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

      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Session"
          description="Create a new academic session."
        >
          <AddSessionForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
