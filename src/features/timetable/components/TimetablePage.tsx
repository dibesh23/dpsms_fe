"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { timetableApi, type TimetableRecord } from "../api/timetableApi";
import { academicApi, type ClassRecord, type SessionRecord } from "@/features/academic/api/academicApi";
import { AddTimetableForm } from "./AddTimetableForm";
import { TrashIcon, PencilIcon } from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  ) {
    const resp = err as { response: { data?: { error?: { message?: string } } } };
    return resp.response.data?.error?.message ?? fallback;
  }
  return fallback;
}

export function TimetablePage() {
  const router = useRouter();
  const [timetables, setTimetables] = useState<TimetableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TimetableRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.TIMETABLE_CREATE);
  const canManage = can(PERMISSIONS.TIMETABLE_MANAGE);

  const load = useCallback(async () => {
    try {
      const result = await timetableApi.listTimetables();
      setTimetables(result.items);
    } catch {
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (values: { classId: string; academicYearId: string; name: string }): Promise<boolean> => {
    try {
      const created = await timetableApi.createTimetable(values);
      toast.success("Timetable created");
      setCreateOpen(false);
      router.push(`/timetable/${created.id}`);
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create timetable"));
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await timetableApi.deleteTimetable(deleteTarget.id);
      toast.success("Timetable deleted");
      setTimetables((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete timetable"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns: Column<TimetableRecord>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (row) => row.name,
      render: (row) => (
        <button
          type="button"
          className="text-left font-medium text-neutral-900 hover:underline"
          onClick={() => router.push(`/timetable/${row.id}`)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "className",
      header: "Class",
      sortValue: (row) => row.className,
      render: (row) => row.className,
    },
    {
      key: "academicYearLabel",
      header: "Academic Year",
      sortValue: (row) => row.academicYearLabel,
      render: (row) => row.academicYearLabel,
    },
    {
      key: "slotCount",
      header: "Slots",
      align: "right",
      sortValue: (row) => row.slotCount,
      render: (row) => row.slotCount,
    },
  ];

  const getSearchText = (row: TimetableRecord) =>
    `${row.name} ${row.className} ${row.academicYearLabel}`;

  const sortValueOf = (row: TimetableRecord, key: string): string | number => {
    switch (key) {
      case "name": return row.name;
      case "className": return row.className;
      case "academicYearLabel": return row.academicYearLabel;
      case "slotCount": return row.slotCount;
      default: return "";
    }
  };

  const table = useTable<TimetableRecord>({
    data: timetables,
    pageSize: 10,
    getSearchText,
    sortValue: sortValueOf,
    defaultSortKey: "name",
  });

  if (loading) return <LoadingState label="Loading timetables..." />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Timetables"
        description="Manage class schedules and period allocations"
        actions={
          canCreate ? (
            <Button text="New Timetable" onClick={() => setCreateOpen(true)} />
          ) : undefined
        }
      />

      <SearchBar
        value={table.query}
        onChange={table.setQuery}
        placeholder="Search timetables..."
      />

      <DataTable
        columns={canManage ? [...columns, {
          key: "actions",
          header: "",
          render: (row) => (
            <RowActions
              actions={[
                {
                  label: "Edit",
                  icon: <PencilIcon className="h-4 w-4" />,
                  onClick: () => router.push(`/timetable/${row.id}`),
                },
                ...(canManage
                  ? [{
                      label: "Delete",
                      icon: <TrashIcon className="h-4 w-4" />,
                      danger: true,
                      onClick: () => setDeleteTarget(row),
                    }]
                  : []),
              ]}
            />
          ),
        }] : columns}
        data={table.pageRows}
        keyExtractor={(row) => row.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No timetables found",
          description: "Create your first timetable to get started.",
          action: canCreate ? (
            <Button text="New Timetable" onClick={() => setCreateOpen(true)} />
          ) : undefined,
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="timetables"
          />
        }
      />

      {canCreate && (
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="New Timetable">
          <AddTimetableForm onAdd={handleCreate} onClose={() => setCreateOpen(false)} />
        </Dialog>
      )}

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Timetable"
      >
        <p className="text-sm text-neutral-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? All period slots will also be removed.
        </p>
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4 mt-4">
          <Button variant="secondary" text="Cancel" onClick={() => setDeleteTarget(null)} className="w-auto" />
          <Button
            variant="danger"
            text={deleteBusy ? "Deleting..." : "Delete"}
            loading={deleteBusy}
            disabled={deleteBusy}
            onClick={handleDelete}
            className="w-auto"
          />
        </div>
      </Dialog>
    </div>
  );
}
