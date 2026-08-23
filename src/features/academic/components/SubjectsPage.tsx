"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { AddSubjectForm, type AddSubjectValues } from "./AddSubjectForm";
import { EditSubjectForm, type EditSubjectValues, type EditableSubject } from "./EditSubjectForm";
import { academicApi, type SubjectRecord as SubjectRecordDto } from "../api/academicApi";
import { BookOpenIcon, PencilIcon, PlusIcon, TrashIcon } from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

const COLUMNS = ({
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (subject: SubjectRecordDto) => void;
  onDelete: (subject: SubjectRecordDto) => void;
}): Column<SubjectRecordDto>[] => [
  {
    key: "name",
    header: "Subject",
    sortValue: (subject) => subject.name,
    render: (subject) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
          <BookOpenIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{subject.name}</p>
          <p className="text-xs text-neutral-400">{subject.code || "—"}</p>
        </div>
      </div>
    ),
  },
  {
    key: "department",
    header: "Department",
    sortValue: (subject) => subject.department,
    render: (subject) => <span className="text-neutral-600">{subject.department || "—"}</span>,
  },
  {
    key: "type",
    header: "Type",
    sortValue: (subject) => subject.type,
    render: (subject) => (
      <span className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600">
        {subject.type === "ELECTIVE" ? "Elective" : "Compulsory"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (subject) => (
      <RowActions
        actions={[
          ...(canUpdate
            ? [
                {
                  label: "Edit details",
                  icon: <PencilIcon className="size-3.5" />,
                  onClick: () => onEdit(subject),
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: "Remove",
                  icon: <TrashIcon className="size-3.5" />,
                  danger: true,
                  onClick: () => onDelete(subject),
                },
              ]
            : []),
        ]}
      />
    ),
  },
];

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectRecordDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditableSubject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectRecordDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.ACADEMIC_SUBJECT_CREATE);
  const canUpdate = can(PERMISSIONS.ACADEMIC_SUBJECT_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_SUBJECT_DELETE);

  const load = useCallback(async () => {
    try {
      setSubjects(await academicApi.listSubjects());
    } catch {
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: AddSubjectValues): Promise<boolean> => {
    try {
      await academicApi.createSubject({
        name: values.name,
        code: values.code?.trim() || undefined,
        type: values.type,
        department: values.department?.trim() || undefined,
      });
      await load();
      setDialogOpen(false);
      toast.success("Subject added successfully.");
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add the subject. Try again."));
      return false;
    }
  };

  const handleUpdate = async (values: EditSubjectValues): Promise<string | null> => {
    if (!editTarget) return "Subject is not loaded yet.";
    try {
      await academicApi.updateSubject(editTarget.id, values);
      await load();
      setEditTarget(null);
      toast.success("Subject updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not update the subject. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteSubject(deleteTarget.id);
      setSubjects((current) => current.filter((s) => s.id !== deleteTarget.id));
      toast.success(`Subject "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not remove the subject. It may still be assigned to teachers or classes.",
        ),
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const departments = useMemo(() => {
    const names = new Set<string>();
    for (const subject of subjects) {
      if (subject.department) names.add(subject.department);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [subjects]);

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "All departments" },
      ...departments.map((d) => ({ value: d, label: d })),
    ],
    [departments],
  );

  const table = useTable<SubjectRecordDto>({
    data: subjects,
    pageSize: 8,
    getSearchText: (subject) => `${subject.name} ${subject.code} ${subject.department}`,
    filterMatch: (subject, value) => (value === "" ? true : subject.department === value),
    sortValue: (subject, key) => String(subject[key as keyof SubjectRecordDto] ?? ""),
    defaultSortKey: "name",
  });

  function openEdit(subject: SubjectRecordDto) {
    setEditTarget({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      type: subject.type === "ELECTIVE" ? "ELECTIVE" : "COMPULSORY",
      department: subject.department,
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Subjects"
        description="Subjects offered across the curriculum"
        actions={
          canCreate ? (
            <Button
              text="New Subject"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by department"
          options={departmentOptions}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search subjects…" />
      </div>

      <DataTable
        columns={COLUMNS({
          canUpdate,
          canDelete,
          onEdit: openEdit,
          onDelete: (subject) => setDeleteTarget(subject),
        })}
        data={table.pageRows}
        keyExtractor={(subject) => subject.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No subjects found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="subjects"
          />
        }
      />

      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Subject"
          description="Create a new subject."
        >
          <AddSubjectForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
        </Dialog>
      )}

      {canUpdate && (
        <Dialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          title="Edit Subject"
          description="Update the subject details or move it to another department."
        >
          {editTarget && (
            <EditSubjectForm
              subject={editTarget}
              departments={departments}
              onUpdate={handleUpdate}
              onClose={() => setEditTarget(null)}
            />
          )}
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Remove Subject"
          description={deleteTarget ? `Remove "${deleteTarget.name}" from the catalog?` : ""}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Subjects with active teacher assignments or class mappings cannot be removed.
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
                text={deleteBusy ? "Removing…" : "Remove Subject"}
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
