"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useToast } from "@/shared/components/ui/toast";
import type { AttachmentItem } from "../api/assignmentApi";
import { studentAssignmentApi, type StudentAssignmentDetail } from "../api/studentAssignmentApi";
import { AttachmentUploader } from "./AttachmentUploader";
import {
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_VARIANT,
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_VARIANT,
  formatBytes,
} from "./labels";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
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

const toDisplay = (a: AttachmentItem) => ({ id: a.id, label: a.label, sizeBytes: a.sizeBytes });

export function StudentAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();
  const [assignment, setAssignment] = useState<StudentAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setAssignment(await studentAssignmentApi.get(id));
    } catch {
      toast.error("Could not load this assignment.");
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Loading assignment…" />;

  if (!assignment) {
    return (
      <EmptyState
        icon={<FileTextIcon className="size-5" />}
        title="Assignment not found"
        description="It may have been removed or you lack access."
        action={
          <Link
            href="/assignments"
            className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-700"
          >
            Back to assignments
          </Link>
        }
      />
    );
  }

  const submission = assignment.submission;
  const isPublished = assignment.status === "PUBLISHED";
  const isGraded = submission?.status === "GRADED";
  const canSubmit = isPublished && !isGraded;
  const isOverdue =
    isPublished && !isGraded && new Date(`${assignment.dueDate}T23:59:59`) < new Date();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/assignments"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to assignments
        </Link>
      </div>

      <PageHeader
        title={assignment.title}
        description={`${assignment.section.className} · ${assignment.section.name}${assignment.subject ? ` · ${assignment.subject.name}` : ""}`}
        actions={
          <StatusBadge
            status={ASSIGNMENT_STATUS_LABEL[assignment.status]}
            variant={ASSIGNMENT_STATUS_VARIANT[assignment.status]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Instructions</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {assignment.instructions}
            </p>
            {assignment.description && (
              <>
                <p className="mt-4 text-xs font-medium text-neutral-400">Description</p>
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-600">
                  {assignment.description}
                </p>
              </>
            )}
          </section>

          {assignment.attachments.length > 0 && (
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">Reference materials</h2>
              <AttachmentUploader
                existing={assignment.attachments.map(toDisplay)}
                onSubmit={async () => {}}
                readOnly
                onOpen={(a) =>
                  void studentAssignmentApi.openAssignmentAttachment(id, a.id, a.label)
                }
              />
            </section>
          )}

          {submission && (
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-neutral-900">Your submission</h2>
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge
                  status={SUBMISSION_STATUS_LABEL[submission.status]}
                  variant={SUBMISSION_STATUS_VARIANT[submission.status]}
                />
                {submission.submittedAt && (
                  <span className="text-xs text-neutral-500">
                    Submitted{" "}
                    {new Date(submission.submittedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
                {submission.isLate && (
                  <span className="text-xs font-medium text-amber-600">Late</span>
                )}
              </div>

              {submission.content && (
                <p className="mb-3 whitespace-pre-line rounded-md bg-bg-subtle px-3 py-2 text-sm text-neutral-700">
                  {submission.content}
                </p>
              )}

              {submission.attachments.length > 0 && (
                <AttachmentUploader
                  existing={submission.attachments.map(toDisplay)}
                  onSubmit={async () => {}}
                  readOnly
                  onOpen={(a) =>
                    void studentAssignmentApi.openAssignmentAttachment(id, a.id, a.label)
                  }
                />
              )}

              {submission.marks !== null && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2Icon className="size-4 flex-none text-emerald-600" />
                  <span className="text-sm text-emerald-700">
                    Marks: <strong>{submission.marks}</strong>
                  </span>
                </div>
              )}
              {submission.feedback && (
                <p className="mt-3 whitespace-pre-line rounded-md border border-neutral-200 px-4 py-3 text-sm text-neutral-700">
                  <span className="font-medium text-neutral-900">Teacher feedback: </span>
                  {submission.feedback}
                </p>
              )}
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Due date</dt>
                <dd className="flex items-center gap-2 font-medium text-neutral-800">
                  {assignment.dueDate}
                  {isOverdue && <StatusBadge status="Overdue" variant="danger" />}
                </dd>
              </div>
            </dl>
          </section>

          {canSubmit ? (
            <SubmissionForm
              assignmentId={id}
              submissionId={submission?.submissionId ?? null}
              onDone={load}
            />
          ) : isGraded ? (
            <section className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
              This submission has already been graded and can no longer be resubmitted.
            </section>
          ) : (
            !isPublished && (
              <section className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
                {assignment.status === "CLOSED"
                  ? "This assignment is closed and no longer accepts submissions."
                  : "This assignment has not been published yet."}
              </section>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionForm({
  assignmentId,
  submissionId,
  onDone,
}: {
  assignmentId: string;
  submissionId: string | null;
  onDone: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [theSubmissionId, setTheSubmissionId] = useState<string | null>(submissionId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    setError(null);
    if (content.trim() === "" && newFiles.length === 0) {
      setError("Add some content or at least one file before submitting.");
      return;
    }
    setBusy(true);
    try {
      const { submissionId: createdId } = await studentAssignmentApi.submit(assignmentId, {
        content: content.trim(),
      });
      setTheSubmissionId(createdId);
      for (const file of newFiles) {
        await studentAssignmentApi.uploadSubmissionAttachment(assignmentId, createdId, file);
      }
      toast.success("Assignment submitted.");
      setContent("");
      setNewFiles([]);
      await onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit the assignment. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-neutral-900">
        {submissionId || theSubmissionId ? "Update submission" : "Submit your work"}
      </h2>

      <label className="mb-1.5 block text-xs font-medium text-neutral-500">Answer</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="Write your answer here…"
        disabled={busy}
        className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500"
      />

      <div className="mt-3">
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">
          Attachments <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        {newFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {newFiles.map((file, i) => (
              <div
                key={`new-${i}`}
                className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs"
              >
                <FileTextIcon className="size-3.5 flex-none text-blue-400" />
                <span className="max-w-[120px] truncate font-medium text-blue-700">
                  {file.name}
                </span>
                <span className="text-blue-400">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={() => setNewFiles((prev) => prev.filter((f) => f !== file))}
                  aria-label="Remove file"
                  className="text-blue-400 hover:text-red-500"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="size-3.5" />
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) setNewFiles((prev) => [...prev, ...files]);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-4">
        <Button
          text={busy ? "Submitting…" : "Submit Assignment"}
          icon={<ClipboardCheckIcon className="size-4" />}
          loading={busy}
          disabled={busy}
          className="w-full"
          onClick={() => void handleSubmit()}
        />
      </div>
    </section>
  );
}

export default StudentAssignmentDetailPage;
