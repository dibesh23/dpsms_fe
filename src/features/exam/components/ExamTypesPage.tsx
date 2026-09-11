"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { examApi, type ExamTypeRecord } from "../api/examApi";
import { ClipboardCheckIcon, PencilIcon, PlusIcon, TrashIcon } from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

const ExamTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});
type ExamTypeValues = z.infer<typeof ExamTypeSchema>;

function ExamTypeForm({
  initial,
  submitLabel,
  onSubmit,
  onClose,
}: {
  initial?: string;
  submitLabel: string;
  onSubmit: (values: ExamTypeValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExamTypeValues>({
    resolver: zodResolver(ExamTypeSchema),
    defaultValues: { name: initial ?? "" },
  });

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        setApiError(null);
        const error = await onSubmit(values);
        if (error) setApiError(error);
      })}
      noValidate
      className="space-y-4"
    >
      <Field
        label="Exam type name"
        error={errors.name?.message}
        hint="e.g. Term Test, Mock, Final Exam"
      >
        <Input
          type="text"
          placeholder="Final Exam"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      {apiError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {apiError}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
        <Button
          text={isSubmitting ? "Saving…" : submitLabel}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

const COLUMNS = ({
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (type: ExamTypeRecord) => void;
  onDelete: (type: ExamTypeRecord) => void;
}): Column<ExamTypeRecord>[] => [
  {
    key: "name",
    header: "Exam type",
    sortValue: (type) => type.name,
    render: (type) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
          <ClipboardCheckIcon className="size-4" />
        </span>
        <span className="font-medium text-neutral-900">{type.name}</span>
      </div>
    ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (type) => (
      <RowActions
        actions={[
          ...(canUpdate
            ? [
                {
                  label: "Edit",
                  icon: <PencilIcon className="size-3.5" />,
                  onClick: () => onEdit(type),
                },
              ]
            : []),
          ...(canDelete
            ? [
                {
                  label: "Remove",
                  icon: <TrashIcon className="size-3.5" />,
                  danger: true,
                  onClick: () => onDelete(type),
                },
              ]
            : []),
        ]}
      />
    ),
  },
];

export function ExamTypesPage() {
  const [types, setTypes] = useState<ExamTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExamTypeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamTypeRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.EXAM_CREATE);
  const canUpdate = can(PERMISSIONS.EXAM_UPDATE);
  const canDelete = can(PERMISSIONS.EXAM_DELETE);

  const load = useCallback(async () => {
    try {
      setTypes(await examApi.listExamTypes());
    } catch {
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: ExamTypeValues): Promise<string | null> => {
    try {
      await examApi.createExamType({ name: values.name });
      await load();
      setCreateOpen(false);
      toast.success("Exam type added.");
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not add the exam type. Try again.");
    }
  };

  const handleUpdate = async (values: ExamTypeValues): Promise<string | null> => {
    if (!editTarget) return "Exam type is not loaded yet.";
    try {
      await examApi.updateExamType(editTarget.id, { name: values.name });
      await load();
      setEditTarget(null);
      toast.success("Exam type updated.");
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not update the exam type. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await examApi.deleteExamType(deleteTarget.id);
      setTypes((current) => current.filter((t) => t.id !== deleteTarget.id));
      toast.success(`Exam type "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Could not remove the exam type. It may still be in use."),
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const table = useTable<ExamTypeRecord>({
    data: types,
    pageSize: 8,
    getSearchText: (type) => type.name,
    sortValue: (type, key) => String(type[key as keyof ExamTypeRecord] ?? ""),
    defaultSortKey: "name",
  });

  if (loading) return <LoadingState label="Loading exam types…" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exam Types"
        description="Categories used to group exams, e.g. Term Test or Final Exam"
        actions={
          canCreate ? (
            <Button
              text="New Exam Type"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setCreateOpen(true)}
            />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search exam types…" />
      </div>

      <DataTable
        columns={COLUMNS({
          canUpdate,
          canDelete,
          onEdit: setEditTarget,
          onDelete: setDeleteTarget,
        })}
        data={table.pageRows}
        keyExtractor={(type) => type.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No exam types yet",
          description: "Create an exam type to start building exams.",
        }}
      />

      {canCreate && (
        <Dialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Exam Type"
          description="Add a category for grouping exams."
        >
          <ExamTypeForm
            submitLabel="Add Exam Type"
            onSubmit={handleAdd}
            onClose={() => setCreateOpen(false)}
          />
        </Dialog>
      )}

      {canUpdate && (
        <Dialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          title="Edit Exam Type"
          description="Update the exam type name."
        >
          {editTarget && (
            <ExamTypeForm
              initial={editTarget.name}
              submitLabel="Save Changes"
              onSubmit={handleUpdate}
              onClose={() => setEditTarget(null)}
            />
          )}
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Remove Exam Type"
          description={deleteTarget ? `Remove "${deleteTarget.name}"?` : ""}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Exam types referenced by exams can still be removed; the exams keep their name.
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
                text={deleteBusy ? "Removing…" : "Remove Exam Type"}
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

export default ExamTypesPage;
