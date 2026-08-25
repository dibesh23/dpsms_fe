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
import { useToast } from "@/shared/components/ui/toast";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import { noticeApi, type AdminNotice, type NoticeApprovalStatus } from "../api/noticeApi";
import {
  studentNoticeApi,
  type MyNoticesResult,
  type NoticeSummary,
} from "../api/studentNoticeApi";
import { useNoticePolling } from "../hooks/useNoticePolling";
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@/shared/components/ui/icons";

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_RESULT: MyNoticesResult = { notices: [], unreadCount: 0 };
const BODY_PREVIEW_LIMIT = 220;

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

// ── My Submissions section ────────────────────────────────────────────────────

function SubmissionRow({ notice }: { notice: AdminNotice }) {
  return (
    <li className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900">{notice.title}</span>
          <StatusBadge
            status={APPROVAL_LABEL[notice.approvalStatus]}
            variant={APPROVAL_VARIANT[notice.approvalStatus]}
          />
        </div>
        {/* Show rejection reason so teacher knows what to fix */}
        {notice.approvalStatus === "REJECTED" && notice.approvalNote && (
          <p className="text-xs text-red-500">Reason: {notice.approvalNote}</p>
        )}
        <p className="text-xs text-neutral-400">
          Submitted {formatDate(notice.createdAt)}
          {notice.approvedByName && ` · reviewed by ${notice.approvedByName}`}
        </p>
      </div>
    </li>
  );
}

// ── Create form schema ────────────────────────────────────────────────────────

const CreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  body: z.string().trim().min(1, "Body is required"),
  isUrgent: z.boolean(),
  scheduledAt: z.string().optional(),
});
type CreateForm = z.output<typeof CreateSchema>;

// ── Expandable body ───────────────────────────────────────────────────────────

function NoticeBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > BODY_PREVIEW_LIMIT;
  const shown = expanded || !isLong ? body : `${body.slice(0, BODY_PREVIEW_LIMIT).trimEnd()}...`;
  return (
    <div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">{shown}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
          {expanded ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
        </button>
      )}
    </div>
  );
}

// ── Notice card ───────────────────────────────────────────────────────────────

function NoticeCard({
  notice,
  onRead,
  onAcknowledge,
}: {
  notice: NoticeSummary;
  onRead: (id: string) => void;
  onAcknowledge: (id: string) => void;
}) {
  const cardRef = useRef<HTMLLIElement>(null);
  const hasMarkedRead = useRef(false);

  useEffect(() => {
    if (notice.isRead || hasMarkedRead.current) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasMarkedRead.current) {
          hasMarkedRead.current = true;
          onRead(notice.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [notice.id, notice.isRead, onRead]);

  return (
    <li
      ref={cardRef}
      className={[
        "p-5 transition-colors",
        !notice.isRead ? "border-l-2 border-l-blue-400 bg-blue-50/40" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {!notice.isRead && (
            <span className="mt-0.5 size-2 flex-none rounded-full bg-blue-500" aria-label="Unread" />
          )}
          <h3 className="text-sm font-semibold text-neutral-900">{notice.title}</h3>
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
        </div>
        <p className="flex-none text-xs text-neutral-400">{formatDate(notice.publishedAt)}</p>
      </div>
      <p className="mt-0.5 text-xs text-neutral-400">Posted by {notice.publishedByName}</p>
      <div className="mt-3">
        <NoticeBody body={notice.body} />
      </div>
      {notice.isUrgent && !notice.isAcknowledged && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangleIcon className="size-4 flex-none text-amber-500" />
          <p className="flex-1 text-xs text-amber-700">
            This is an urgent notice. Please acknowledge that you have read it.
          </p>
          <Button
            text="Acknowledge"
            variant="secondary"
            onClick={() => onAcknowledge(notice.id)}
            className="w-auto flex-none text-xs"
          />
        </div>
      )}
      {notice.isUrgent && notice.isAcknowledged && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
          <CheckCircle2Icon className="size-3.5" />
          You acknowledged this notice
        </div>
      )}
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
  onCreated: () => void;
}) {
  const { success, error } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(CreateSchema),
    defaultValues: { isUrgent: false },
  });

  const onSubmit = async (values: CreateForm) => {
    try {
      await noticeApi.create({
        title: values.title,
        body: values.body,
        isUrgent: values.isUrgent,
        ...(values.scheduledAt
          ? { scheduledAt: new Date(values.scheduledAt).toISOString() }
          : {}),
      });
      // Teacher notices go to PENDING_APPROVAL — never publish directly
      success("Notice submitted for principal approval");
      reset();
      onCreated();
      onClose();
    } catch {
      error("Failed to submit notice");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Post Notice">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Title" error={errors.title?.message} required>
          <Input {...register("title")} placeholder="Notice title" />
        </Field>
        <Field label="Body" error={errors.body?.message} required>
          <textarea
            {...register("body")}
            rows={4}
            placeholder="Write the notice content…"
            className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            {...register("isUrgent")}
            className="size-4 rounded border-neutral-300 accent-red-600"
          />
          Mark as Urgent
        </label>
        <Field label="Schedule for (optional)" error={undefined}>
          <Input type="datetime-local" {...register("scheduledAt")} />
        </Field>
        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-3">
          <Button type="button" variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
          <Button
            type="submit"
            text="Submit for Approval"
            loading={isSubmitting}
            className="w-auto"
          />
        </div>
      </form>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function TeacherNoticePage() {
  const { success, error } = useToast();
  const [result, setResult] = useState<MyNoticesResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<AdminNotice[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newBanner, setNewBanner] = useState(0);

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await noticeApi.getMySubmissions();
      setSubmissions(res.items);
    } catch {
      setSubmissions([]);
    }
  }, []);

  const { seed, refresh } = useNoticePolling({
    onNewNotices: (count) => setNewBanner(count),
    onRefresh: (data) => {
      setResult(data);
      setLoading(false);
    },
  });

  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current && result.notices.length > 0) {
      seeded.current = true;
      seed(result.notices.map((n) => n.id));
    }
  }, [result.notices, seed]);

  // Load submissions on mount
  useEffect(() => { void loadSubmissions(); }, [loadSubmissions]);

  const handleRead = useCallback((id: string) => {
    setResult((prev) => {
      const updated = prev.notices.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return { notices: updated, unreadCount: updated.filter((n) => !n.isRead).length };
    });
    studentNoticeApi.markRead(id).catch(() => {});
  }, []);

  const handleAcknowledge = useCallback(
    async (id: string) => {
      setResult((prev) => ({
        ...prev,
        notices: prev.notices.map((n) =>
          n.id === id ? { ...n, isRead: true, isAcknowledged: true } : n,
        ),
      }));
      try {
        await studentNoticeApi.acknowledge(id);
        success("Notice acknowledged");
        refresh();
      } catch {
        setResult((prev) => ({
          ...prev,
          notices: prev.notices.map((n) =>
            n.id === id ? { ...n, isAcknowledged: false } : n,
          ),
        }));
        error("Failed to acknowledge notice");
      }
    },
    [success, error, refresh],
  );

  const table = useTable<NoticeSummary>({
    data: result.notices,
    pageSize: 6,
    getSearchText: (n) => `${n.title} ${n.body} ${n.publishedByName}`,
    filterMatch: (n, value) => {
      if (value === "URGENT") return n.isUrgent;
      if (value === "UNREAD") return !n.isRead;
      return false;
    },
    sortValue: (n, _key) => n.publishedAt,
    defaultSortKey: "publishedAt",
    defaultSortDir: "desc",
  });

  const urgentCount = useMemo(() => result.notices.filter((n) => n.isUrgent).length, [result.notices]);
  const pendingAckCount = useMemo(
    () => result.notices.filter((n) => n.isUrgent && !n.isAcknowledged).length,
    [result.notices],
  );

  const filterOptions = [
    { value: "UNREAD", label: `Unread (${result.unreadCount})` },
    { value: "URGENT", label: `Urgent (${urgentCount})` },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notices & Announcements"
        description="View school notices and post announcements"
        actions={
          <Button
            text="Submit Notice"
            icon={<PlusIcon className="size-4" />}
            onClick={() => setCreateOpen(true)}
            className="w-auto"
          />
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="Total" value={loading ? "-" : String(result.notices.length)} icon={<BellIcon className="size-4" />} />
        <StatsCard label="Unread" value={loading ? "-" : String(result.unreadCount)} icon={<BellIcon className="size-4" />} />
        <StatsCard label="Urgent" value={loading ? "-" : String(urgentCount)} icon={<AlertTriangleIcon className="size-4" />} />
        <StatsCard label="Pending Ack." value={loading ? "-" : String(pendingAckCount)} icon={<CheckCircle2Icon className="size-4" />} />
      </section>

      {newBanner > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <BellIcon className="size-4 flex-none text-blue-500" />
            <p className="text-sm text-blue-700">
              <strong>{newBanner} new {newBanner === 1 ? "notice" : "notices"}</strong>{" "}
              {newBanner === 1 ? "has" : "have"} been posted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewBanner(0)}
            className="flex-none text-xs font-medium text-blue-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {pendingAckCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangleIcon className="size-4 flex-none text-amber-500" />
          <p className="text-sm text-amber-700">
            You have <strong>{pendingAckCount}</strong> urgent{" "}
            {pendingAckCount === 1 ? "notice" : "notices"} waiting for acknowledgement.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown label="Filter" options={filterOptions} value={table.filter} onChange={table.setFilter} />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search notices…" />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
        {table.pageRows.length === 0 ? (
          <EmptyState
            icon={<BellIcon className="size-5" />}
            title="No notices found"
            description={table.query || table.filter ? "Try adjusting your search or filter." : "No notices yet."}
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {table.pageRows.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onRead={handleRead}
                onAcknowledge={(id) => void handleAcknowledge(id)}
              />
            ))}
          </ul>
        )}
        <Pagination
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={table.setPage}
          label="notices"
        />
      </div>

      <CreateNoticeDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          void refresh();
          void loadSubmissions(); // refresh submissions list too
        }}
      />

      {/* My Submissions panel */}
      {submissions.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
          <div className="border-b border-neutral-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">My Submitted Notices</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Notices you submitted — waiting for principal review
            </p>
          </div>
          <ul className="divide-y divide-neutral-100">
            {submissions.map((s) => (
              <SubmissionRow key={s.id} notice={s} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TeacherNoticePage;
