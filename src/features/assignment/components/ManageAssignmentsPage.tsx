"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { academicApi } from "@/features/academic/api/academicApi";
import {
  assignmentApi,
  type AssignmentListItem,
  type AssignmentCreatePayload,
  type AssignmentStatus,
} from "../api/assignmentApi";
import { AddAssignmentForm, type TeacherOwnSection } from "./AddAssignmentForm";
import { ASSIGNMENT_STATUS_LABEL, ASSIGNMENT_STATUS_VARIANT } from "./labels";
import { ArrowUpRightIcon, FileTextIcon, PlusIcon, TrashIcon } from "@/shared/components/ui/icons";

const STATUSES: AssignmentStatus[] = ["DRAFT", "PUBLISHED", "CLOSED"];

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

export function ManageAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [sections, setSections] = useState<TeacherOwnSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const [list, own] = await Promise.all([
        assignmentApi.list({ pageSize: 500 }),
        academicApi.getMyAssignedClasses().catch(() => []),
      ]);
      setAssignments(list.items);
      setSections(
        own.flatMap((group) =>
          group.sections.map((s) => ({
            sectionId: s.sectionId,
            sectionName: s.sectionName,
            className: group.className,
          })),
        ),
      );
    } catch {
      setAssignments([]);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (payload: AssignmentCreatePayload): Promise<string | null> => {
    try {
      const created = await assignmentApi.create(payload);
      setCreateOpen(false);
      toast.success("Assignment created.");
      router.push(`/manage-assignments/${created.id}`);
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not create the assignment. Check the details and try again.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await assignmentApi.remove(deleteTarget.id);
      setAssignments((current) => current.filter((a) => a.id !== deleteTarget.id));
      toast.success(`Assignment "${deleteTarget.title}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the assignment."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const table = useTable<AssignmentListItem>({
    data: assignments,
    pageSize: 8,
    getSearchText: (a) => `${a.title} ${a.subjectName ?? ""} ${a.className} ${a.sectionName}`,
    filterMatch: (a, value) => (value === "" ? true : a.status === value),
    sortValue: (a, key) => String(a[key as keyof AssignmentListItem] ?? ""),
    defaultSortKey: "createdAt",
  });

  if (loading) return <LoadingState label="Loading assignments…" />;

  const columns: Column<AssignmentListItem>[] = [
    {
      key: "title",
      header: "Assignment",
      sortValue: (a) => a.title,
      render: (a) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
            <FileTextIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{a.title}</p>
            <p className="text-xs text-neutral-400">{a.subjectName ?? "No subject"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "section",
      header: "Section",
      sortValue: (a) => a.sectionName,
      render: (a) => (
        <span className="text-neutral-600">
          {a.className} · {a.sectionName}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due date",
      sortValue: (a) => a.dueDate,
      render: (a) => <span className="text-neutral-600">{a.dueDate}</span>,
    },
    {
      key: "studentCount",
      header: "Students",
      sortValue: (a) => a.studentCount,
      render: (a) => <span className="font-medium text-neutral-700">{a.studentCount}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => a.status,
      render: (a) => (
        <StatusBadge
          status={ASSIGNMENT_STATUS_LABEL[a.status]}
          variant={ASSIGNMENT_STATUS_VARIANT[a.status]}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <RowActions
          actions={[
            {
              label: "View details",
              icon: <ArrowUpRightIcon className="size-3.5" />,
              onClick: () => router.push(`/manage-assignments/${a.id}`),
            },
            {
              label: "Delete",
              danger: true,
              icon: <TrashIcon className="size-3.5" />,
              onClick: () => setDeleteTarget(a),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assignments"
        description="Create, publish and grade home assignments for your sections"
        actions={
          <Button
            text="New Assignment"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setCreateOpen(true)}
          />
        }
      />

      {sections.length === 0 && (
        <EmptyState
          icon={<FileTextIcon className="size-5" />}
          title="No sections assigned"
          description="You need to be assigned to a class section before creating assignments."
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by status"
          options={STATUSES.map((status) => ({
            value: status,
            label: ASSIGNMENT_STATUS_LABEL[status],
          }))}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search assignments…"
        />
      </div>

      <DataTable
        columns={columns}
        data={table.pageRows}
        keyExtractor={(a) => a.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No assignments found",
          description: "Create an assignment to get started.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="assignments"
          />
        }
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Assignment"
        description="Details students will see. Reference files can be added after creating."
        maxWidth="max-w-2xl"
      >
        {sections.length > 0 && (
          <AddAssignmentForm
            sections={sections}
            onAdd={handleCreate}
            onClose={() => setCreateOpen(false)}
          />
        )}
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Assignment"
        description={deleteTarget ? `Delete "${deleteTarget.title}"?` : ""}
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            This permanently removes the assignment and all student submissions.
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
              text={deleteBusy ? "Deleting…" : "Delete Assignment"}
              loading={deleteBusy}
              disabled={deleteBusy}
              className="w-auto"
              onClick={() => void handleDelete()}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default ManageAssignmentsPage;
