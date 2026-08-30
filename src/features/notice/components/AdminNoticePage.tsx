"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  noticeApi,
  type AdminNotice,
  type NoticeApprovalStatus,
  type NoticeAttachment,
} from "../api/noticeApi";
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

// ── Helpers ───────────────────────────────────────────────────────────────────

function publishStatus(n: AdminNotice): "published" | "scheduled" | "draft" {
  if (n.publishedAt) return "published";
  if (n.scheduledAt) return "scheduled";
  return "draft";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp";

// ── Attachment chip ───────────────────────────────────────────────────────────

function AttachmentChip({
  attachment,
  noticeId,
  onDelete,
}: {
  attachment: NoticeAttachment;
  noticeId: string;
  onDelete?: (id: string) => void;
}) {
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    try {
      await noticeApi.openAttachment(noticeId, attachment.id, attachment.label);
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs">
      <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
      <button
        type="button"
        onClick={() => void handleOpen()}
        disabled={opening}
        className="max-w-[160px] truncate font-medium text-neutral-700 hover:underline disabled:opacity-50"
      >
        {opening ? "Opening…" : attachment.label}
      </button>
      <span className="text-neutral-400">{formatBytes(attachment.sizeBytes)}</span>
      <button
        type="button"
        onClick={() => void handleOpen()}
        disabled={opening}
        className="text-neutral-400 hover:text-neutral-700 disabled:opacity-50 transition-colors"
        aria-label="Download"
      >
        <DownloadIcon className="size-3.5" />
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(attachment.id)}
          className="text-neutral-400 hover:text-red-500 transition-colors"
          aria-label="Remove attachment"
        >
          <TrashIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

const EditSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  body: z.string().trim().min(1, "Body is required"),
  isUrgent: z.boolean(),
  scheduledAt: z.string().optional(),
});
type EditForm = z.output<typeof EditSchema>;

function EditNoticeDialog({
  notice,
  onClose,
  onUpdated,
}: {
  notice: AdminNotice | null;
  onClose: () => void;
  onUpdated: (notice: AdminNotice) => void;
}) {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [replacingId, setReplacingId] = useState<string | null>(null); // attachment being replaced
  const [replaceFileRef] = useState(() => ({ current: null as HTMLInputElement | null }));
  const [saving, setSaving] = useState(false);

  const isPublished = !!notice?.publishedAt;  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      title: notice?.title ?? "",
      body: notice?.body ?? "",
      isUrgent: notice?.isUrgent ?? false,
      scheduledAt: notice?.scheduledAt
        ? new Date(notice.scheduledAt).toISOString().slice(0, 16)
        : undefined,
    },
  });

  // Re-populate form when notice changes
  useEffect(() => {
    if (notice) {
      reset({
        title: notice.title,
        body: notice.body,
        isUrgent: notice.isUrgent,
        scheduledAt: notice.scheduledAt
          ? new Date(notice.scheduledAt).toISOString().slice(0, 16)
          : undefined,
      });
      setNewFiles([]);
    }
  }, [notice, reset]);

  if (!notice) return null;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.size <= 5 * 1024 * 1024);
    setNewFiles((prev) => [...prev, ...files].slice(0, 5 - notice.attachments.length));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Replace = upload new file for a specific attachment slot, delete the old one
  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>, attachmentId: string) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    // Store the pending replacement in newFiles tagged with the old id
    setNewFiles((prev) => [
      ...prev.filter((f) => (f as File & { _replaces?: string })._replaces !== attachmentId),
      Object.assign(file, { _replaces: attachmentId }),
    ]);
    if (replaceFileRef.current) replaceFileRef.current.value = "";
  };

  const onSubmit = async (values: EditForm) => {
    setSaving(true);
    try {
      // 1. Update text fields
      let updated = await noticeApi.update(notice.id, {
        title: values.title,
        body: values.body,
        isUrgent: values.isUrgent,
        scheduledAt: values.scheduledAt
          ? new Date(values.scheduledAt).toISOString()
          : null,
      });

      // 2. Process replacements (delete old → upload new)
      for (const file of newFiles) {
        const replaces = (file as File & { _replaces?: string })._replaces;
        if (replaces) {
          try {
            await noticeApi.deleteAttachment(notice.id, replaces);
          } catch {
            // non-fatal if old file already gone
          }
        }
        try {
          const attachment = await noticeApi.uploadAttachment(notice.id, file);
          // Remove old from updated attachments if replacing
          updated = {
            ...updated,
            attachments: [
              ...updated.attachments.filter((a) => a.id !== replaces),
              attachment,
            ],
          };
        } catch {
          error(`Failed to upload ${file.name}`);
        }
      }

      success("Notice updated");
      onUpdated(updated);
      onClose();
    } catch {
      error("Failed to update notice");
    } finally {
      setSaving(false);
    }
  };

  const totalAttachments = notice.attachments.length +
    newFiles.filter((f) => !(f as File & { _replaces?: string })._replaces).length;

  return (
    <Dialog open={notice !== null} onClose={onClose} title="Edit Notice">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title" error={errors.title?.message} required>
          <Input {...register("title")} placeholder="Notice title" />
        </Field>

        <Field label="Body" error={errors.body?.message} required>
          <textarea
            {...register("body")}
            rows={4}
            placeholder="Write the notice content here…"
            className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" {...register("isUrgent")} className="size-4 rounded border-neutral-300 accent-red-600" />
          Mark as Urgent
        </label>

        <Field label="Schedule for (optional)" error={undefined}>
          <Input type="datetime-local" {...register("scheduledAt")} />
        </Field>

        {/* Existing attachments — each can be replaced */}
        {notice.attachments.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Attachments</p>
            <div className="space-y-1.5">
              {notice.attachments.map((a) => {
                const pendingReplacement = (newFiles as (File & { _replaces?: string })[])
                  .find((f) => f._replaces === a.id);
                return (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs">
                    <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
                    <span className={`max-w-[140px] truncate font-medium ${pendingReplacement ? "line-through text-neutral-400" : "text-neutral-700"}`}>
                      {a.label}
                    </span>
                    <span className="text-neutral-400">{formatBytes(a.sizeBytes)}</span>
                    {pendingReplacement ? (
                      <span className="text-blue-600 truncate max-w-[100px]">
                        → {pendingReplacement.name}
                      </span>
                    ) : (
                      <label className="ml-auto cursor-pointer text-neutral-500 hover:text-blue-600 transition-colors">
                        <span className="text-xs">Replace</span>
                        <input
                          type="file"
                          accept={ACCEPTED_FILE_TYPES}
                          className="hidden"
                          onChange={(e) => handleReplaceFile(e, a.id)}
                        />
                      </label>
                    )}
                    {pendingReplacement && (
                      <button
                        type="button"
                        onClick={() =>
                          setNewFiles((prev) =>
                            (prev as (File & { _replaces?: string })[]).filter(
                              (f) => f._replaces !== a.id,
                            ),
                          )
                        }
                        className="text-xs text-neutral-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add new files */}
        {totalAttachments < 5 && (
          <div>
            {newFiles.filter((f) => !(f as File & { _replaces?: string })._replaces).length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                {(newFiles as (File & { _replaces?: string })[])
                  .filter((f) => !f._replaces)
                  .map((file, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs">
                      <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
                      <span className="max-w-[120px] truncate font-medium text-neutral-700">{file.name}</span>
                      <span className="text-neutral-400">{formatBytes(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => setNewFiles((prev) => prev.filter((f) => f !== file))}
                        className="text-neutral-400 hover:text-red-500"
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
              className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <PlusIcon className="size-3.5" />
              Add file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              multiple
              className="hidden"
              onChange={handleAddFiles}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-3">
          <Button type="button" variant="secondary" text="Cancel" onClick={onClose} className="w-auto" disabled={saving} />
          <Button type="submit" text="Save Changes" loading={saving} className="w-auto" />
        </div>
      </form>
    </Dialog>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  body: z.string().trim().min(1, "Body is required"),
  isUrgent: z.boolean(),
  scheduledAt: z.string().optional(),
});
type CreateForm = z.output<typeof CreateSchema>;

// ── Review dialog ─────────────────────────────────────────────────────────────

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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-neutral-900">{notice.title}</span>
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
        </div>
        <p className="whitespace-pre-line rounded-lg border border-neutral-100 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
          {notice.body}
        </p>
        {/* Attachments in review */}
        {notice.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {notice.attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} noticeId={notice.id} />
            ))}
          </div>
        )}
        <p className="text-xs text-neutral-400">
          Submitted {formatDate(notice.createdAt)} · by {notice.publishedByName}
        </p>
      </div>

      <div className="mt-5 space-y-3 border-t border-neutral-100 pt-4">
        {!showRejectForm ? (
          <div className="flex gap-3">
            <Button text="Approve & Publish" onClick={() => onApprove(notice.id)} loading={approving} className="flex-1" />
            <Button text="Reject" variant="danger" onClick={() => setShowRejectForm(true)} disabled={approving} className="w-auto" />
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
                onClick={() => { if (rejectNote.trim()) onReject(notice.id, rejectNote.trim()); }}
                loading={rejecting}
                disabled={!rejectNote.trim()}
                className="flex-1"
              />
              <Button text="Back" variant="secondary" onClick={() => setShowRejectForm(false)} disabled={rejecting} className="w-auto" />
            </div>
          </div>
        )}
        <Button text="Close" variant="secondary" onClick={onClose} disabled={approving || rejecting} className="w-full" />
      </div>
    </Dialog>
  );
}

// ── Reject dialog ─────────────────────────────────────────────────────────────

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
  useEffect(() => { if (open) setNote(""); }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="Reject Notice">
      <p className="mb-3 text-sm text-neutral-600">Provide a reason so the teacher knows what to fix.</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="e.g. Please revise the wording in the second paragraph…"
        className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
        <Button variant="danger" text="Reject" onClick={() => { if (note.trim()) onConfirm(note.trim()); }} loading={loading} disabled={!note.trim()} className="w-auto" />
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
  onEdit,
  onDelete,
  onAttachmentDeleted,
}: {
  notice: AdminNotice;
  onReview: (notice: AdminNotice) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPublish: (id: string) => void;
  onEdit: (notice: AdminNotice) => void;
  onDelete: (id: string) => void;
  onAttachmentDeleted: (noticeId: string, attachmentId: string) => void;
}) {
  const pubStatus = publishStatus(notice);
  const isPending = notice.approvalStatus === "PENDING_APPROVAL";
  const isRejected = notice.approvalStatus === "REJECTED";

  const actions = [
    { label: "Edit", onClick: () => onEdit(notice) },
    ...(notice.approvalStatus === "APPROVED" && (pubStatus === "draft" || pubStatus === "scheduled")
      ? [{ label: "Publish now", onClick: () => onPublish(notice.id) }]
      : []),
    { label: "Delete", onClick: () => onDelete(notice.id), danger: true as const },
  ];

  return (
    <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        {/* Title + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-neutral-900">{notice.title}</span>
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
          {(isPending || isRejected) && (
            <StatusBadge status={APPROVAL_LABEL[notice.approvalStatus]} variant={APPROVAL_VARIANT[notice.approvalStatus]} />
          )}
          {!isPending && (
            <StatusBadge status={PUBLISH_LABEL[pubStatus]} variant={PUBLISH_VARIANT[pubStatus]} />
          )}
          {pubStatus === "scheduled" && notice.scheduledAt && (
            <span className="text-xs font-medium text-amber-600">
              → {new Date(notice.scheduledAt).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {/* Body preview */}
        <p className="line-clamp-2 text-xs text-neutral-500">{notice.body}</p>

        {/* Rejection reason */}
        {isRejected && notice.approvalNote && (
          <p className="text-xs text-red-500">Reason: {notice.approvalNote}</p>
        )}

        {/* Attachments */}
        {notice.attachments.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {notice.attachments.map((a) => (
              <AttachmentChip
                key={a.id}
                attachment={a}
                noticeId={notice.id}
                onDelete={(attachmentId) => onAttachmentDeleted(notice.id, attachmentId)}
              />
            ))}
          </div>
        )}

        {/* Meta */}
        <p className="text-xs text-neutral-400">
          {pubStatus === "published" && notice.publishedAt
            ? `Published ${formatDate(notice.publishedAt)}`
            : pubStatus === "scheduled" && notice.scheduledAt
              ? `Scheduled for ${formatDate(notice.scheduledAt)}`
              : `Submitted ${formatDate(notice.createdAt)}`}
          {" · by "}
          {notice.publishedByName}
        </p>

        {/* Approval buttons for pending notices */}
        {isPending && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button text="Review & Approve" onClick={() => onReview(notice)} className="w-auto text-xs" />
            <Button text="Quick Approve" variant="secondary" onClick={() => onApprove(notice.id)} className="w-auto text-xs" />
            <Button text="Reject" variant="danger" onClick={() => onReject(notice.id)} className="w-auto text-xs" />
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<CreateForm>({
      resolver: zodResolver(CreateSchema),
      defaultValues: { isUrgent: false },
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Max 5 files, each max 5MB
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024).slice(0, 5);
    setSelectedFiles((prev) => [...prev, ...valid].slice(0, 5));
    // Reset input so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    reset();
    setSelectedFiles([]);
    onClose();
  };

  const onSubmit = async (values: CreateForm) => {
    try {
      // Step 1: create the notice
      const created = await noticeApi.create({
        title: values.title,
        body: values.body,
        isUrgent: values.isUrgent,
        ...(values.scheduledAt ? { scheduledAt: new Date(values.scheduledAt).toISOString() } : {}),
      });

      // Step 2: upload attachments sequentially
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        let updatedNotice = created;
        for (const file of selectedFiles) {
          try {
            const attachment = await noticeApi.uploadAttachment(created.id, file);
            updatedNotice = {
              ...updatedNotice,
              attachments: [...updatedNotice.attachments, attachment],
            };
          } catch {
            // Non-fatal — notice is already created, just log the failure
            error(`Failed to upload ${file.name}`);
          }
        }
        setUploadingFiles(false);
        success(values.scheduledAt ? "Notice scheduled" : "Notice published");
        reset();
        setSelectedFiles([]);
        onCreated(updatedNotice);
      } else {
        success(values.scheduledAt ? "Notice scheduled" : "Notice published");
        reset();
        onCreated(created);
      }
      onClose();
    } catch {
      setUploadingFiles(false);
      error("Failed to create notice");
    }
  };

  const busy = isSubmitting || uploadingFiles;

  return (
    <Dialog open={open} onClose={handleClose} title="New Notice">
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

        {/* Attachments */}
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            Attachments <span className="text-xs font-normal text-neutral-400">(PDF, image — max 5MB each, up to 5 files)</span>
          </p>

          {selectedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs">
                  <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
                  <span className="max-w-[140px] truncate font-medium text-neutral-700">{file.name}</span>
                  <span className="text-neutral-400">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(i)}
                    className="text-neutral-400 hover:text-red-500 transition-colors"
                    aria-label="Remove"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <PlusIcon className="size-3.5" />
              Add file
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-3">
          <Button type="button" variant="secondary" text="Cancel" onClick={handleClose} className="w-auto" disabled={busy} />
          <Button
            type="submit"
            text={uploadingFiles ? "Uploading…" : watch("scheduledAt") ? "Schedule" : "Publish"}
            loading={busy}
            className="w-auto"
          />
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
  const [editNotice, setEditNotice] = useState<AdminNotice | null>(null);

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

  const pendingCount   = useMemo(() => notices.filter((n) => n.approvalStatus === "PENDING_APPROVAL").length, [notices]);
  const publishedCount = useMemo(() => notices.filter((n) => n.publishedAt).length, [notices]);
  const urgentCount    = useMemo(() => notices.filter((n) => n.isUrgent).length, [notices]);

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

  // Remove an attachment from a notice optimistically
  const handleAttachmentDeleted = async (noticeId: string, attachmentId: string) => {
    // Optimistic update
    setNotices((prev) =>
      prev.map((n) =>
        n.id === noticeId
          ? { ...n, attachments: n.attachments.filter((a) => a.id !== attachmentId) }
          : n,
      ),
    );
    // Also update reviewNotice if open
    setReviewNotice((prev) =>
      prev?.id === noticeId
        ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) }
        : prev,
    );
    try {
      await noticeApi.deleteAttachment(noticeId, attachmentId);
      success("Attachment removed");
    } catch {
      // Revert on failure
      void load();
      error("Failed to remove attachment");
    }
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
                onEdit={(n) => setEditNotice(n)}
                onDelete={(id) => setDeleteTarget(id)}
                onAttachmentDeleted={(nid, aid) => void handleAttachmentDeleted(nid, aid)}
              />
            ))}
          </ul>
        )}
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} label="notices" />
      </div>

      <EditNoticeDialog
        notice={editNotice}
        onClose={() => setEditNotice(null)}
        onUpdated={(n) => { upsert(n); }}
      />
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
