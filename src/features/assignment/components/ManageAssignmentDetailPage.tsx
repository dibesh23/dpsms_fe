"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { PageHeader } from "@/shared/components/ui/page-header";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useToast } from "@/shared/components/ui/toast";
import { assignmentApi, type AssignmentDetail } from "../api/assignmentApi";
import { AttachmentUploader, type DisplayAttachment } from "./AttachmentUploader";
import { ASSIGNMENT_STATUS_LABEL, ASSIGNMENT_STATUS_VARIANT } from "./labels";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClockIcon,
  FileTextIcon,
} from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

export function ManageAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const toast = useToast();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setAssignment(await assignmentApi.get(id));
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

  const handleAction = async (action: "publish" | "close") => {
    setBusy(true);
    try {
      if (action === "publish") {
        await assignmentApi.publish(id);
        toast.success("Assignment published.");
      } else {
        await assignmentApi.close(id);
        toast.success("Assignment closed.");
      }
      await load();
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          action === "publish"
            ? "Could not publish the assignment."
            : "Could not close the assignment.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        await assignmentApi.uploadAttachment(id, file);
        toast.success(`Uploaded ${file.name}`);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    await load();
  };

  const handleRemoveAttachment = async (attachment: DisplayAttachment) => {
    try {
      await assignmentApi.deleteAttachment(id, attachment.id);
      toast.success("Attachment removed.");
      await load();
    } catch {
      toast.error("Could not remove the attachment.");
    }
  };

  if (loading) return <LoadingState label="Loading assignment…" />;
  if (!assignment) {
    return (
      <EmptyState
        icon={<FileTextIcon className="size-5" />}
        title="Assignment not found"
        description="It may have been removed or you lack access."
        action={
          <Link
            href="/manage-assignments"
            className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-700"
          >
            Back to assignments
          </Link>
        }
      />
    );
  }

  const isPublished = assignment.status === "PUBLISHED";
  const isClosed = assignment.status === "CLOSED";

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/manage-assignments"
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

          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Reference materials</h2>
            <AttachmentUploader
              existing={assignment.attachments}
              onSubmit={handleUpload}
              onOpen={(a) => void assignmentApi.openAttachment(id, a.id, a.label)}
              onRemove={handleRemoveAttachment}
            />
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Due date</dt>
                <dd className="font-medium text-neutral-800">{assignment.dueDate}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Teacher</dt>
                <dd className="text-neutral-800">{assignment.teacher.fullName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Created</dt>
                <dd className="text-neutral-800">
                  {new Date(assignment.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-2 rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-900">Actions</h2>
            {assignment.status === "DRAFT" && (
              <Button
                text="Publish assignment"
                icon={<CheckCircle2Icon className="size-4" />}
                loading={busy}
                className="w-full"
                onClick={() => void handleAction("publish")}
              />
            )}
            {isPublished && (
              <Button
                text="Close assignment"
                icon={<ClockIcon className="size-4" />}
                variant="secondary"
                loading={busy}
                className="w-full"
                onClick={() => void handleAction("close")}
              />
            )}
            <Button
              text="Grade submissions"
              icon={<ClipboardCheckIcon className="size-4" />}
              variant="secondary"
              className="w-full"
              onClick={() => router.push(`/manage-assignments/${id}/submissions`)}
            />
            {isClosed && (
              <p className="text-xs text-neutral-500">
                This assignment is closed and no longer accepts new submissions.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ManageAssignmentDetailPage;
