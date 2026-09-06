"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
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
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  FileTextIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/shared/components/ui/icons";

const IN_PROGRESS = "IN_PROGRESS";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

const EXAM_STATUSES: ExamStatus[] = ["DRAFT", "MARKS_ENTRY", "SUBMITTED", "PUBLISHED", "CANCELLED"];

const EXAM_TILE: Record<ExamStatus, string> = {
  DRAFT: "border-neutral-200 bg-neutral-100 text-neutral-500",
  MARKS_ENTRY: "border-blue-100 bg-blue-50 text-blue-600",
  SUBMITTED: "border-amber-100 bg-amber-50 text-amber-600",
  PUBLISHED: "border-emerald-100 bg-emerald-50 text-emerald-600",
  CANCELLED: "border-red-100 bg-red-50 text-red-500",
};

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return formatter.format(diffSeconds, "second");
  if (abs < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 604800) return formatter.format(Math.round(diffSeconds / 86400), "day");
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SubjectProgress({ exam }: { exam: ExamListItem }) {
  const total = exam.subjectCount;

  if (total === 0) {
    return <span className="text-xs text-neutral-400">No subjects yet</span>;
  }

  let pct = 0;
  let tone = "";
  let caption = "";
  switch (exam.status) {
    case "MARKS_ENTRY":
      pct = Math.round((exam.subjectsEntered / total) * 100);
      tone = "bg-blue-500";
      caption = `${exam.subjectsEntered} of ${total} entered`;
      break;
    case "SUBMITTED":
      pct = Math.round((exam.subjectsApproved / total) * 100);
      tone = "bg-amber-500";
      caption = `${exam.subjectsApproved} of ${total} approved`;
      break;
    case "PUBLISHED":
      pct = 100;
      tone = "bg-emerald-500";
      caption = `${total} approved`;
      break;
    case "DRAFT":
      caption = "Not started";
      break;
    case "CANCELLED":
      caption = "Cancelled";
      break;
  }

  return (
    <div className="w-32">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        {pct > 0 && (
          <div
            className={cn("h-full rounded-full transition-all", tone)}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-400">{caption}</p>
    </div>
  );
}

function StatCard({
  active,
  onClick,
  label,
  value,
  icon,
  tileClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  value: number;
  icon: ReactNode;
  tileClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start justify-between gap-3 rounded-[18px] border bg-white p-4 text-left transition",
        active
          ? "border-neutral-900 ring-1 ring-neutral-900"
          : "border-neutral-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
      </div>
      <span
        className={cn(
          "flex size-9 flex-none items-center justify-center rounded-full border",
          tileClass,
        )}
      >
        {icon}
      </span>
    </button>
  );
}

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
        <span
          className={cn(
            "flex size-9 flex-none items-center justify-center rounded-xl border",
            EXAM_TILE[exam.status],
          )}
        >
          <FileTextIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{exam.name}</p>
          <p className="truncate text-xs text-neutral-400">{exam.examTypeName}</p>
        </div>
      </div>
    ),
  },
  {
    key: "class",
    header: "Class",
    sortValue: (exam) => exam.className,
    render: (exam) => (
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium text-neutral-700">
          <LayoutGridIcon className="size-3.5 flex-none text-neutral-400" />
          <span className="truncate">{exam.className}</span>
        </p>
        <p className="ml-5 truncate text-xs text-neutral-400">
          {exam.academicYearLabel}
          {exam.termName ? ` · ${exam.termName}` : ""}
        </p>
      </div>
    ),
  },
  {
    key: "subjects",
    header: "Subjects",
    sortValue: (exam) => exam.subjectCount,
    render: (exam) => (
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-xs font-semibold text-neutral-600">
          {exam.subjectCount}
        </span>
        <SubjectProgress exam={exam} />
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortValue: (exam) => exam.status,
    render: (exam) => (
      <StatusBadge
        status={EXAM_STATUS_LABEL[exam.status]}
        variant={EXAM_STATUS_VARIANT[exam.status]}
      />
    ),
  },
  {
    key: "createdAt",
    header: "Created",
    sortValue: (exam) => exam.createdAt,
    render: (exam) => (
      <span className="flex items-center gap-1.5 whitespace-nowrap text-neutral-500">
        <CalendarDaysIcon className="size-3.5 text-neutral-400" />
        {relativeTime(exam.createdAt)}
      </span>
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
      setExams(
        await examApi.listExams({
          pageSize: 500,
          sortBy: "createdAt",
          sortDir: "desc",
        }),
      );
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const byStatus = new Map<ExamStatus, number>();
    for (const exam of exams) {
      byStatus.set(exam.status, (byStatus.get(exam.status) ?? 0) + 1);
    }
    return {
      total: exams.length,
      draft: byStatus.get("DRAFT") ?? 0,
      inProgress: (byStatus.get("MARKS_ENTRY") ?? 0) + (byStatus.get("SUBMITTED") ?? 0),
      published: byStatus.get("PUBLISHED") ?? 0,
    };
  }, [exams]);

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
    getSearchText: (exam) =>
      `${exam.name} ${exam.examTypeName} ${exam.className} ${exam.academicYearLabel} ${exam.termName ?? ""}`,
    filterMatch: (exam, value) => {
      if (value === "") return true;
      if (value === IN_PROGRESS)
        return exam.status === "MARKS_ENTRY" || exam.status === "SUBMITTED";
      return exam.status === value;
    },
    sortValue: (exam, key) => {
      const raw = exam[key as keyof ExamListItem];
      return typeof raw === "number" ? raw : String(raw ?? "");
    },
    defaultSortKey: "createdAt",
    defaultSortDir: "desc",
  });

  if (loading) return <LoadingState label="Loading exams…" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Exams"
        description="Create exams, enter marks and manage the approval workflow"
        actions={
          canCreate ? (
            <Button
              text="New Exam"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setCreateOpen(true)}
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          active={table.filter === null}
          onClick={() => table.setFilter(null)}
          label="All exams"
          value={counts.total}
          icon={<FileTextIcon className="size-4" />}
          tileClass="border-neutral-200 bg-neutral-50 text-neutral-600"
        />
        <StatCard
          active={table.filter === "DRAFT"}
          onClick={() => table.setFilter("DRAFT")}
          label="Drafts"
          value={counts.draft}
          icon={<PencilIcon className="size-4" />}
          tileClass="border-neutral-200 bg-neutral-50 text-neutral-600"
        />
        <StatCard
          active={table.filter === IN_PROGRESS}
          onClick={() => table.setFilter(IN_PROGRESS)}
          label="In progress"
          value={counts.inProgress}
          icon={<ClipboardCheckIcon className="size-4" />}
          tileClass="border-blue-100 bg-blue-50 text-blue-600"
        />
        <StatCard
          active={table.filter === "PUBLISHED"}
          onClick={() => table.setFilter("PUBLISHED")}
          label="Published"
          value={counts.published}
          icon={<CheckCircle2Icon className="size-4" />}
          tileClass="border-emerald-100 bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterDropdown
            label="All statuses"
            options={[
              { value: IN_PROGRESS, label: "In progress" },
              { value: "DRAFT", label: EXAM_STATUS_LABEL.DRAFT },
              { value: "MARKS_ENTRY", label: EXAM_STATUS_LABEL.MARKS_ENTRY },
              { value: "SUBMITTED", label: EXAM_STATUS_LABEL.SUBMITTED },
              { value: "PUBLISHED", label: EXAM_STATUS_LABEL.PUBLISHED },
              { value: "CANCELLED", label: EXAM_STATUS_LABEL.CANCELLED },
            ]}
            value={table.filter}
            onChange={table.setFilter}
          />
          <span className="text-xs text-neutral-400">
            {table.rows.length} of {counts.total} exams
          </span>
        </div>
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
        minWidth="min-w-[880px]"
        empty={{
          title: "No exams found",
          description:
            table.filter || table.query
              ? "No exams match the current search or filter."
              : "Create an exam to get started.",
          action:
            canCreate && !table.filter && !table.query ? (
              <Button
                text="Create an exam"
                icon={<PlusIcon className="size-4" />}
                className="w-auto"
                onClick={() => setCreateOpen(true)}
              />
            ) : undefined,
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
        <Dialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="New Exam"
          description="Create an exam for a class."
          maxWidth="max-w-2xl"
        >
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
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setDeleteTarget(null)}
                className="w-auto"
              />
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
