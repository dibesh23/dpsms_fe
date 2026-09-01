"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { assignmentApi, type SubmissionRowItem, type SubmissionDetail } from "../api/assignmentApi";
import { AttachmentUploader, type DisplayAttachment } from "./AttachmentUploader";
import { SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_VARIANT } from "./labels";
import { ArrowLeftIcon, ClipboardCheckIcon, GraduationCapIcon } from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

export function ManageAssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const [rows, setRows] = useState<SubmissionRowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeTarget, setGradeTarget] = useState<SubmissionRowItem | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await assignmentApi.listSubmissions(id);
      setRows(result.items);
    } catch {
      toast.error("Could not load submissions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const table = useTable<SubmissionRowItem>({
    data: rows,
    pageSize: 8,
    getSearchText: (s) => `${s.studentName} ${s.admissionNumber} ${s.rollNumber}`,
    sortValue: (s, key) => String(s[key as keyof SubmissionRowItem] ?? ""),
    defaultSortKey: "studentName",
  });

  if (loading) return <LoadingState label="Loading submissions…" />;

  const columns: Column<SubmissionRowItem>[] = [
    {
      key: "studentName",
      header: "Student",
      sortValue: (s) => s.studentName,
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
            <GraduationCapIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{s.studentName}</p>
            <p className="text-xs text-neutral-400">
              {s.rollNumber} · {s.admissionNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (s) => s.status,
      render: (s) => (
        <StatusBadge
          status={SUBMISSION_STATUS_LABEL[s.status]}
          variant={SUBMISSION_STATUS_VARIANT[s.status]}
        />
      ),
    },
    {
      key: "submittedAt",
      header: "Submitted",
      sortValue: (s) => s.submittedAt ?? "",
      render: (s) =>
        s.submittedAt ? (
          <div>
            <p className="text-neutral-700">
              {new Date(s.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {s.isLate && <p className="text-xs text-amber-600">Late</p>}
          </div>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      key: "marks",
      header: "Marks",
      align: "right",
      sortValue: (s) => s.marks ?? -1,
      render: (s) =>
        s.marks !== null ? (
          <span className="font-medium text-neutral-700">{s.marks}</span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <RowActions
          actions={[
            {
              label: "Grade",
              icon: <ClipboardCheckIcon className="size-3.5" />,
              onClick: () => setGradeTarget(s),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/manage-assignments/${id}`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to assignment
        </Link>
      </div>

      <PageHeader title="Submissions" description="Review and grade each student's submission" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {rows.filter((r) => r.marks !== null).length} of {rows.length} graded
        </p>
      </div>

      <DataTable
        columns={columns}
        data={table.pageRows}
        keyExtractor={(s) => s.submissionId}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No submissions yet",
          description: "Submissions will appear here as students turn in their work.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="submissions"
          />
        }
      />

      {gradeTarget && (
        <GradeDialog
          assignmentId={id}
          submission={gradeTarget}
          onClose={() => setGradeTarget(null)}
          onGraded={load}
        />
      )}
    </div>
  );
}

function GradeDialog({
  assignmentId,
  submission,
  onClose,
  onGraded,
}: {
  assignmentId: string;
  submission: SubmissionRowItem;
  onClose: () => void;
  onGraded: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [marks, setMarks] = useState(submission.marks !== null ? String(submission.marks) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assignmentApi
      .getSubmission(assignmentId, submission.submissionId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [assignmentId, submission.submissionId]);

  const handleSave = async () => {
    setError(null);
    const parsed = Number(marks);
    if (marks.trim() === "" || Number.isNaN(parsed) || parsed < 0) {
      setError("Enter a valid marks value.");
      return;
    }
    setBusy(true);
    try {
      await assignmentApi.grade(assignmentId, submission.submissionId, {
        marks: parsed,
        feedback: feedback.trim() || undefined,
      });
      toast.success("Submission graded.");
      onClose();
      await onGraded();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the grade."));
    } finally {
      setBusy(false);
    }
  };

  const attachments: DisplayAttachment[] =
    detail?.attachments.map((a) => ({ id: a.id, label: a.label, sizeBytes: a.sizeBytes })) ?? [];

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Grade ${submission.studentName}`}
      description="Assign marks and optional feedback."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {detail?.content && (
          <p className="whitespace-pre-line rounded-md bg-bg-subtle px-3 py-2 text-sm text-neutral-700">
            {detail.content}
          </p>
        )}
        {attachments.length > 0 && (
          <AttachmentUploader
            existing={attachments}
            onSubmit={async () => {}}
            readOnly
            onOpen={(a) =>
              void assignmentApi.openSubmissionAttachment(
                assignmentId,
                submission.submissionId,
                a.id,
                a.label,
              )
            }
          />
        )}

        <Field label="Marks" required>
          <Input
            type="number"
            min={0}
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="e.g. 85"
            disabled={busy}
          />
        </Field>

        <Field label="Feedback" hint="Optional">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="Private note for the student…"
            disabled={busy}
            className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500"
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
          <Button
            text={busy ? "Saving…" : "Save Grade"}
            loading={busy}
            disabled={busy}
            className="w-auto"
            onClick={() => void handleSave()}
          />
        </div>
      </div>
    </Dialog>
  );
}

export default ManageAssignmentSubmissionsPage;
