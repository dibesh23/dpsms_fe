"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import { EditSessionForm, type EditSessionValues } from "./EditSessionForm";
import { academicApi } from "../api/academicApi";
import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/shared/components/ui/icons";

export interface AcademicSession {
  id: string;
  name: string;
  start: string;
  end: string;
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
  canDelete,
  activatingId,
  onSetActive,
  onEdit,
  onDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  activatingId: string | null;
  onSetActive: (session: AcademicSession) => void;
  onEdit: (session: AcademicSession) => void;
  onDelete: (session: AcademicSession) => void;
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
          <Link
            href={`/academic-sessions/${session.id}`}
            className="truncate font-medium text-neutral-900 hover:underline"
          >
            {session.name}
          </Link>
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
            label: "View details",
            icon: <ArrowUpRightIcon className="size-3.5" />,
            href: `/academic-sessions/${session.id}`,
          },
          ...(canUpdate
            ? [
                {
                  label: "Edit",
                  icon: <PencilIcon className="size-3.5" />,
                  onClick: () => onEdit(session),
                },
              ]
            : []),
          ...(canUpdate && !session.isActive
            ? [
                {
                  label: activatingId === session.id ? "Setting active…" : "Set active",
                  icon: <CheckCircle2Icon className="size-3.5" />,
                  onClick: () => onSetActive(session),
                },
              ]
            : []),
          ...(canDelete && !session.isActive
            ? [
                {
                  label: "Remove",
                  icon: <TrashIcon className="size-3.5" />,
                  danger: true,
                  onClick: () => onDelete(session),
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
  const [editTarget, setEditTarget] = useState<AcademicSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicSession | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.ACADEMIC_SESSION_CREATE);
  const canUpdate = can(PERMISSIONS.ACADEMIC_SESSION_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_SESSION_DELETE);

  const load = useCallback(async () => {
    try {
      const records = await academicApi.listSessions();
      setSessions(
        records.map((r) => ({
          id: r.id,
          name: r.label,
          start: r.startDate.slice(0, 10),
          end: r.endDate.slice(0, 10),
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
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteSession(deleteTarget.id);
      setSessions((current) => current.filter((s) => s.id !== deleteTarget.id));
      toast.success(`Academic year "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
    } catch {
      toast.error(
        "Could not remove the academic year. It may still have classes, enrollments, or exams.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTarget, toast]);

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
          start: record.startDate.slice(0, 10),
          end: record.endDate.slice(0, 10),
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
    getSearchText: (session) => `${session.name} ${session.status}`,
    filterMatch: (session, value) => session.status === value,
    sortValue: (session, key) => String(session[key as keyof AcademicSession] ?? ""),
    defaultSortKey: "start",
  });

  const handleSaveEdit = async (values: EditSessionValues): Promise<string | null> => {
    if (!editTarget) return "Could not save changes. Try again.";
    try {
      const record = await academicApi.updateSession(editTarget.id, {
        label: values.label,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      setSessions((current) =>
        current.map((s) => (s.id === record.id ? { ...s, name: record.label } : s)),
      );
      setEditTarget(null);
      toast.success("Academic year updated successfully.");
      return null;
    } catch (err) {
      return err instanceof Error && "response" in err
        ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
            ?.message ?? "Could not update the academic year. Try again.")
        : "Could not update the academic year. Try again.";
    }
  };

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
          canDelete,
          activatingId,
          onSetActive: (s) => void handleSetActive(s),
          onEdit: (session) => setEditTarget(session),
          onDelete: (session) => setDeleteTarget(session),
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

      {canUpdate && editTarget && (
        <Dialog
          open
          onClose={() => setEditTarget(null)}
          title="Edit Academic Year"
          description={`Update "${editTarget.name}".`}
        >
          <EditSessionForm
            initial={{
              label: editTarget.name,
              startDate: editTarget.start,
              endDate: editTarget.end,
            }}
            onSave={handleSaveEdit}
            onClose={() => setEditTarget(null)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Remove Academic Year"
          description={
            deleteTarget ? `Remove "${deleteTarget.name}"? This action cannot be undone.` : ""
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              The backend rejects removal while this year is active or has classes, enrollments, or
              exams attached.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setDeleteTarget(null)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={deleteBusy ? "Removing…" : "Remove Session"}
                loading={deleteBusy}
                disabled={deleteBusy}
                className="w-auto"
                onClick={() => void handleDelete()}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
