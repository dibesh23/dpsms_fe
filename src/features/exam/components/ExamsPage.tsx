"use client";

import { useState, useEffect, useCallback } from "react";
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
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { examApi, type ExamListItem } from "../api/examApi";
import { AddExamForm, type ExamSubjectPayload } from "./AddExamForm";
import { EXAM_STATUS_LABEL, EXAM_STATUS_VARIANT } from "./labels";
import type { ExamStatus } from "../api/studentExamApi";
import {
  ArrowUpRightIcon,
  FileTextIcon,
  PlusIcon,
  TrashIcon,
} from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

const EXAM_STATUSES: ExamStatus[] = ["DRAFT", "MARKS_ENTRY", "SUBMITTED", "PUBLISHED", "CANCELLED"];

const COLUMNS = ({
  canDelete,
  onView,
  onDelete,
}: {
  canDelete: boolean;
  onView: (exam: ExamListItem) => void;
  onDelete: (exam: ExamListItem) => void;
}): Column<ExamListItem>[] => [
  {
    key: "name",
    header: "Exam",
    sortValue: (exam) => exam.name,
    render: (exam) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
          <FileTextIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{exam.name}</p>
          <p className="text-xs text-neutral-400">{exam.examTypeName}</p>
        </div>
      </div>
    ),
  },
  {
    key: "class",
    header: "Class",
    sortValue: (exam) => exam.className,
    render: (exam) => <span className="text-neutral-600">{exam.className}</span>,
  },
  {
    key: "year",
    header: "Academic year",
    sortValue: (exam) => exam.academicYearLabel,
    render: (exam) => <span className="text-neutral-600">{exam.academicYearLabel}</span>,
  },
  {
    key: "term",
    header: "Term",
    sortValue: (exam) => exam.termName ?? "",
    render: (exam) => <span className="text-neutral-600">{exam.termName || "—"}</span>,
  },
  {
    key: "subjects",
    header: "Subjects",
    sortValue: (exam) => exam.subjectCount,
    render: (exam) => <span className="text-neutral-600">{exam.subjectCount}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (exam) => exam.status,
    render: (exam) => (
      <StatusBadge status={EXAM_STATUS_LABEL[exam.status]} variant={EXAM_STATUS_VARIANT[exam.status]} />
    ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (exam) => (
      <RowActions
        actions={[
          {
            label: "View details",
            icon: <ArrowUpRightIcon className="size-3.5" />,
            onClick: () => onView(exam),
          },
          ...(canDelete && exam.status === "DRAFT"
            ? [
                {
                  label: "Delete draft",
                  icon: <TrashIcon className="size-3.5" />,
                  danger: true,
                  onClick: () => onDelete(exam),
                },
              ]
            : []),
        ]}
      />
    ),
  },
];

export function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExamListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.EXAM_CREATE);
  const canDelete = can(PERMISSIONS.EXAM_DELETE);

  const load = useCallback(async () => {
    try {
      setExams(await examApi.listExams());
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (
    values: { name: string; examTypeId: string; classId: string },
    subjects: ExamSubjectPayload[],
  ): Promise<string | null> => {
    try {
      const created = await examApi.createExam({
        name: values.name,
        examTypeId: values.examTypeId,
        classId: values.classId,
        subjects: subjects.map((row) => ({
          subjectId: row.subjectId,
          fullMarksTheory: row.fullMarksTheory,
          fullMarksPractical: row.fullMarksPractical,
          passMarks: row.passMarks,
        })),
      });
      setCreateOpen(false);
      toast.success("Exam created.");
      router.push(`/exams/${created.id}`);
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not create the exam. Check the details and try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await examApi.deleteExam(deleteTarget.id);
      setExams((current) => current.filter((e) => e.id !== deleteTarget.id));
      toast.success(`Exam "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the exam."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const table = useTable<ExamListItem>({
    data: exams,
    pageSize: 8,
    getSearchText: (exam) => `${exam.name} ${exam.examTypeName} ${exam.className} ${exam.academicYearLabel}`,
    filterMatch: (exam, value) => (value === "" ? true : exam.status === value),
    sortValue: (exam, key) => String(exam[key as keyof ExamListItem] ?? ""),
    defaultSortKey: "createdAt",
  });

  if (loading) return <LoadingState label="Loading exams…" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exams"
        description="Create exams, enter marks and manage the approval workflow"
        actions={
          canCreate ? (
            <Button text="New Exam" icon={<PlusIcon className="size-4" />} className="w-auto" onClick={() => setCreateOpen(true)} />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by status"
          options={[
            { value: "", label: "All statuses" },
            ...EXAM_STATUSES.map((status) => ({ value: status, label: EXAM_STATUS_LABEL[status] })),
          ]}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search exams…" />
      </div>

      <DataTable
        columns={COLUMNS({
          canDelete,
          onView: (exam) => router.push(`/exams/${exam.id}`),
          onDelete: setDeleteTarget,
        })}
        data={table.pageRows}
        keyExtractor={(exam) => exam.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No exams found",
          description: "Create an exam to get started.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="exams"
          />
        }
      />

      {canCreate && (
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="New Exam" description="Create an exam for a class." maxWidth="max-w-2xl">
          <AddExamForm onAdd={handleAdd} onClose={() => setCreateOpen(false)} />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Delete Exam"
          description={deleteTarget ? `Delete "${deleteTarget.name}"?` : ""}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Only draft exams can be deleted. Cancel a started exam instead.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button variant="secondary" text="Cancel" onClick={() => setDeleteTarget(null)} className="w-auto" />
              <Button
                variant="danger"
                text={deleteBusy ? "Deleting…" : "Delete Exam"}
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

export default ExamsPage;