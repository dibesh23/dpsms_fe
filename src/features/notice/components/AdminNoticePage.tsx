"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Field } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { RowActions } from "@/shared/components/ui/row-actions";
import { useToast } from "@/shared/components/ui/toast";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import { noticeApi, type AdminNotice, type NoticeApprovalStatus } from "../api/noticeApi";
import { AlertTriangleIcon, BellIcon, CheckCircle2Icon, PlusIcon, UsersIcon } from "@/shared/components/ui/icons";

// ── Helpers ───────────────────────────────────────────────────────────────────

function publishStatus(n: AdminNotice): "published" | "scheduled" | "draft" {
  if (n.publishedAt) return "published";
  if (n.scheduledAt) return "scheduled";
  return "draft";
}

const PUBLISH_VARIANT: Record<string, StatusVariant> = {
  published: "success",
  scheduled: "warning",
  draft: "neutral",
};

const PUBLISH_LABEL: Record<string, string> = {
  published: "Published",
  scheduled: "Scheduled",
  draft: "Draft",
};

const APPROVAL_VARIANT: Record<NoticeApprovalStatus, StatusVariant> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const APPROVAL_LABEL: Record<NoticeApprovalStatus, string> = {
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const FILTER_OPTIONS = [
  { value: "pending",   label: "Pending Approval" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft",     label: "Draft" },
  { value: "rejected",  label: "Rejected" },
  { value: "urgent",    label: "Urgent" },
];

// ── Create form ───────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  body: z.string().trim().min(1, "Body is required"),
  isUrgent: z.boolean().optional().default(false),
  scheduledAt: z.string().optional(),
});
type CreateForm = z.infer<typeof CreateSchema>;

// ── Review dialog (principal reads full notice before approving/rejecting) ────

function ReviewDialog({
  notice,
  onClose,
  onApprove,
  onReject,
  approving,
  rejecting,
}: {
  notice: AdminNotice | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (!notice) { setShowRejectForm(false); setRejectNote(""); }
  }, [notice]);

  if (!notice) return null;

  return (
    <Dialog open={notice !== null} onClose={onClose} title="Review Notice">
      {/* Notice content */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-neutral-900">{notice.title}</span>
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
        </div>
        <p className="whitespace-pre-line rounded-lg bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700 border border-neutral-100">
          {notice.body}
        </p>
        <p className="text-xs text-neutral-400">
          Submitted {formatDate(notice.createdAt)} · by {notice.publishedByName}
        </p>
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4 space-y-3">
        {!showRejectForm ? (
          <div className="flex gap-3">
            <Button
              text="Approve & Publish"
              onClick={() => onApprove(notice.id)}
              loading={approving}
              className="flex-1"
            />
            <Button
              text="Reject"
              variant="danger"
              onClick={() => setShowRejectForm(true)}
              disabled={approving}
              className="w-auto"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-700">
              Reason for rejection <span className="text-red-500">*</span>
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="e.g. Please revise the wording in the second paragraph…"
              className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                text="Send Rejection"
                variant="danger"
                onClick={() => {
                  if (rejectNote.trim()) onReject(notice.id, rejectNote.trim());
                }}
                loading={rejecting}
                disabled={!rejectNote.trim()}
                className="flex-1"
              />
              <Button
                text="Back"
                variant="secondary"
                onClick={() => setShowRejectForm(false)}
                disabled={rejecting}
                className="w-auto"
              />
            </div>
          </div>
        )}
        <Button
          text="Close"
          variant="secondary"
          onClick={onClose}
          disabled={approving || rejecting}
          className="w-full"
        />
      </div>
    </Dialog>
  );
}

// ── Reject dialog (used from row actions) ─────────────────────────────────────

function RejectDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    if (!note.trim()) return;
    onConfirm(note.trim());
  };

  // Reset note when dialog opens
  useEffect(() => { if (open) setNote(""); }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="Reject Notice">
      <p className="text-sm text-neutral-600 mb-3">
        Provide a reason so the teacher knows what to fix.
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="e.g. Please revise the wording in the second paragraph…"
        className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
        <Button
          variant="danger"
          text="Reject"
          onClick={handleConfirm}
          loading={loading}
          disabled={!note.trim()}
          className="w-auto"
        />
      </div>
    </Dialog>
  );
}

// ── Notice row ────────────────────────────────────────────────────────────────

function NoticeRow({
  notice,
  onReview,
  onApprove,
  onReject,
  onPublish,
  onDelete,
}: {
  notice: AdminNotice;
  onReview: (notice: AdminNotice) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const pubStatus = publishStatus(notice);
  const isPending = notice.approvalStatus === "PENDING_APPROVAL";
  const isRejected = notice.approvalStatus === "REJECTED";

  // Only non-pending actions go in the dropdown
  const actions = [
    ...(notice.approvalStatus === "APPROVED" && (pubStatus === "draft" || pubStatus === "scheduled")
      ? [{ label: "Publish now", onClick: () => onPublish(notice.id) }]
      : []),
    { label: "Delete", onClick: () => onDelete(notice.id), danger: true as const },
  ];

  return (
    <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-neutral-900">{notice.title}</span>
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
          {(isPending || isRejected) && (
            <StatusBadge
              status={APPROVAL_LABEL[notice.approvalStatus]}
              variant={APPROVAL_VARIANT[notice.approvalStatus]}
            />
          )}
          {!isPending && (
            <StatusBadge status={PUBLISH_LABEL[pubStatus]} variant={PUBLISH_VARIANT[pubStatus]} />
          )}
          {pubStatus === "scheduled" && notice.scheduledAt && (
            <span className="text-xs text-amber-600 font-medium">
              → {new Date(notice.scheduledAt).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-xs text-neutral-500">{notice.body}</p>
        {isRejected && notice.approvalNote && (
          <p className="text-xs text-red-500">Reason: {notice.approvalNote}</p>
        )}
        <p className="text-xs text-neutral-400">
          {pubStatus === "published" && notice.publishedAt
            ? `Published ${formatDate(notice.publishedAt)}`
            : pubStatus === "scheduled" && notice.scheduledAt
              ? `Scheduled for ${formatDate(notice.scheduledAt)}`
              : `Submitted ${formatDate(notice.createdAt)}`}
          {" · by "}
          {notice.publishedByName}
        </p>

        {/* Inline Approve / Reject buttons — only for pending, always visible */}
        {isPending && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              text="Review & Approve"
              onClick={() => onReview(notice)}
              className="w-auto text-xs"
            />
            <Button
              text="Quick Approve"
              variant="secondary"
              onClick={() => onApprove(notice.id)}
              className="w-auto text-xs"
            />
            <Button
              text="Reject"
              variant="danger"
              onClick={() => onReject(notice.id)}
              className="w-auto text-xs"
            />
          </div>
        )}
      </div>
      <div className="flex flex-none items-center self-start">
        <RowActions actions={actions} />
      </div>
    </li>
  );
}

// ── Create dialog ─────────────────────────────────────────────────────────────

function CreateNoticeDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (notice: AdminNotice) => void;
}) {
  const { success, error } = useToast();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<CreateForm>({
      resolver: zodResolver(CreateSchema),
      defaultValues: { isUrgent: false },
    });

  const onSubmit = async (values: CreateForm) => {
    try {
      const created = await noticeApi.create({
        title: values.title,
        body: values.body,
        isUrgent: values.isUrgent,
        ...(values.scheduledAt ? { scheduledAt: new Date(values.scheduledAt).toISOString() } : {}),
      });
      success(values.scheduledAt ? "Notice scheduled" : "Notice published");
      reset();
      onCreated(created);
      onClose();
    } catch {
      error("Failed to create notice");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New Notice">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title" error={errors.title?.message} required>
          <Input {...register("title")} placeholder="Notice title" />
        </Field>
        <Field label="Body" error={errors.body?.message} required>
          <textarea
            {...register("body")}
            rows={5}
            placeholder="Write the notice content here…"
            className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" {...register("isUrgent")} className="size-4 rounded border-neutral-300 accent-red-600" />
          Mark as Urgent
          <span className="text-xs text-neutral-400">(requires acknowledgement)</span>
        </label>
        <Field label="Schedule for (optional)" error={undefined}>
          <Input type="datetime-local" {...register("scheduledAt")} />
        </Field>
        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-3">
          <Button type="button" variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
          <Button type="submit" text={watch("scheduledAt") ? "Schedule" : "Publish"} loading={isSubmitting} className="w-auto" />
        </div>
      </form>
    </Dialog>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirmDialog({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Delete Notice">
      <p className="text-sm text-neutral-600">This will permanently remove the notice.</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
        <Button variant="danger" text="Delete" onClick={onConfirm} loading={loading} className="w-auto" />
      </div>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminNoticePage() {
  const { success, error } = useToast();
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<AdminNotice | null>(null);
  const [reviewApproving, setReviewApproving] = useState(false);
  const [reviewRejecting, setReviewRejecting] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await noticeApi.list({ pageSize: 100 });
      setNotices(result.items);
    } catch {
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const table = useTable<AdminNotice>({
    data: notices,
    pageSize: 8,
    getSearchText: (n) => `${n.title} ${n.body} ${n.publishedByName}`,
    filterMatch: (n, value) => {
      if (value === "urgent")   return n.isUrgent;
      if (value === "pending")  return n.approvalStatus === "PENDING_APPROVAL";
      if (value === "rejected") return n.approvalStatus === "REJECTED";
      return publishStatus(n) === value;
    },
    sortValue: (n, _key) => n.publishedAt ?? n.createdAt,
    defaultSortKey: "publishedAt",
    defaultSortDir: "desc",
  });

  const pendingCount  = useMemo(() => notices.filter((n) => n.approvalStatus === "PENDING_APPROVAL").length, [notices]);
  const publishedCount = useMemo(() => notices.filter((n) => n.publishedAt).length, [notices]);
  const urgentCount   = useMemo(() => notices.filter((n) => n.isUrgent).length, [notices]);

  const upsert = (updated: AdminNotice) =>
    setNotices((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));

  const handleApprove = async (id: string) => {
    setReviewApproving(true);
    try {
      upsert(await noticeApi.approve(id));
      success("Notice approved and published");
      setReviewNotice(null);
    } catch {
      error("Failed to approve notice");
    } finally {
      setReviewApproving(false);
    }
  };

  const handleRejectConfirm = async (note: string, targetId?: string) => {
    const id = targetId ?? rejectTarget ?? reviewNotice?.id;
    if (!id) return;
    setRejectLoading(true);
    setReviewRejecting(true);
    try {
      upsert(await noticeApi.reject(id, note));
      success("Notice rejected");
      setReviewNotice(null);
      setRejectTarget(null);
    } catch {
      error("Failed to reject notice");
    } finally {
      setRejectLoading(false);
      setReviewRejecting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      upsert(await noticeApi.publish(id));
      success("Notice published");
    } catch {
      error("Failed to publish notice");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await noticeApi.delete(deleteTarget);
      setNotices((prev) => prev.filter((n) => n.id !== deleteTarget));
      success("Notice deleted");
    } catch {
      error("Failed to delete notice");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleCreated = (notice: AdminNotice) => {
    setNotices((prev) =>
      [notice, ...prev].sort(
        (a, b) =>
          new Date(b.publishedAt ?? b.createdAt).getTime() -
          new Date(a.publishedAt ?? a.createdAt).getTime(),
      ),
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notices & Announcements"
        description="Create notices and review teacher submissions"
        actions={
          <Button text="New Notice" icon={<PlusIcon className="size-4" />} onClick={() => setCreateOpen(true)} className="w-auto" />
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="Pending Approval" value={loading ? "-" : String(pendingCount)} icon={<CheckCircle2Icon className="size-4" />} />
        <StatsCard label="Published"        value={loading ? "-" : String(publishedCount)} icon={<BellIcon className="size-4" />} />
        <StatsCard label="Urgent"           value={loading ? "-" : String(urgentCount)} icon={<AlertTriangleIcon className="size-4" />} />
        <StatsCard label="Total"            value={loading ? "-" : String(notices.length)} icon={<UsersIcon className="size-4" />} />
      </section>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <CheckCircle2Icon className="size-4 flex-none text-amber-500" />
          <p className="text-sm text-amber-700">
            <strong>{pendingCount}</strong> teacher {pendingCount === 1 ? "notice" : "notices"} waiting for your approval.
            Filter by <strong>Pending Approval</strong> to review.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown label="Filter" options={FILTER_OPTIONS} value={table.filter} onChange={table.setFilter} />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search notices…" />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
        {table.pageRows.length === 0 ? (
          <EmptyState
            icon={<BellIcon className="size-5" />}
            title="No notices found"
            description={table.query || table.filter ? "Try adjusting your search or filter." : "Create your first notice using the button above."}
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {table.pageRows.map((notice) => (
              <NoticeRow
                key={notice.id}
                notice={notice}
                onReview={(n) => setReviewNotice(n)}
                onApprove={(id) => void handleApprove(id)}
                onReject={(id) => setRejectTarget(id)}
                onPublish={(id) => void handlePublish(id)}
                onDelete={(id) => setDeleteTarget(id)}
              />
            ))}
          </ul>
        )}
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} label="notices" />
      </div>

      <ReviewDialog
        notice={reviewNotice}
        onClose={() => setReviewNotice(null)}
        onApprove={(id) => void handleApprove(id)}
        onReject={(id, note) => void handleRejectConfirm(note, id)}
        approving={reviewApproving}
        rejecting={reviewRejecting}
      />
      <CreateNoticeDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      <RejectDialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={(note) => void handleRejectConfirm(note)}
        loading={rejectLoading}
      />
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
        loading={deleteLoading}
      />
    </div>
  );
}

export default AdminNoticePage;
