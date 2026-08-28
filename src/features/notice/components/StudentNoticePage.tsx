"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNoticePolling } from "../hooks/useNoticePolling";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { useToast } from "@/shared/components/ui/toast";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import {
  studentNoticeApi,
  type MyNoticesResult,
  type NoticeSummary,
} from "../api/studentNoticeApi";
import { noticeApi } from "../api/noticeApi";
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
} from "@/shared/components/ui/icons";

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_RESULT: MyNoticesResult = { notices: [], unreadCount: 0 };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Attachment chip ───────────────────────────────────────────────────────────

function AttachmentChip({ noticeId, attachment }: {
  noticeId: string;
  attachment: { id: string; label: string; mimeType: string; sizeBytes: number };
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
    <button
      type="button"
      onClick={() => void handleOpen()}
      disabled={opening}
      className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs transition-colors hover:bg-neutral-100 disabled:opacity-50"
    >
      <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
      <span className="max-w-[160px] truncate font-medium text-neutral-700">
        {opening ? "Opening…" : attachment.label}
      </span>
      <span className="text-neutral-400">{formatBytes(attachment.sizeBytes)}</span>
      <DownloadIcon className="size-3.5 flex-none text-neutral-400" />
    </button>
  );
}

// ── Notice detail dialog ──────────────────────────────────────────────────────

function NoticeDetailDialog({
  notice,
  onClose,
  onAcknowledge,
}: {
  notice: NoticeSummary | null;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
}) {
  if (!notice) return null;

  return (
    <Dialog open={notice !== null} onClose={onClose} title={notice.title}>
      <div className="space-y-4">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
          <span>{formatDate(notice.publishedAt)}</span>
          <span>·</span>
          <span>Posted by {notice.publishedByName}</span>
        </div>

        {/* Body — full text, no truncation */}
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
            {notice.body}
          </p>
        </div>

        {/* Attachments */}
        {notice.attachments.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">
              Attachments ({notice.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {notice.attachments.map((a) => (
                <AttachmentChip key={a.id} noticeId={notice.id} attachment={a} />
              ))}
            </div>
          </div>
        )}

        {/* Urgent acknowledgement */}
        {notice.isUrgent && !notice.isAcknowledged && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangleIcon className="size-4 flex-none text-amber-500" />
            <p className="flex-1 text-xs text-amber-700">
              Please acknowledge that you have read and understood this urgent notice.
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
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2Icon className="size-3.5" />
            You acknowledged this notice
          </div>
        )}

        <div className="flex justify-end border-t border-neutral-100 pt-3">
          <Button variant="secondary" text="Close" onClick={onClose} className="w-auto" />
        </div>
      </div>
    </Dialog>
  );
}

// ── Notice card (list item) ───────────────────────────────────────────────────

function NoticeCard({
  notice,
  onRead,
  onClick,
}: {
  notice: NoticeSummary;
  onRead: (id: string) => void;
  onClick: (notice: NoticeSummary) => void;
}) {
  const cardRef = useRef<HTMLLIElement>(null);
  const hasMarkedRead = useRef(false);

  // Auto mark-as-read when 60% visible
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
      onClick={() => onClick(notice)}
      className={[
        "cursor-pointer px-5 py-4 transition-colors hover:bg-neutral-50",
        !notice.isRead ? "border-l-2 border-l-blue-400 bg-blue-50/40" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2">
            {!notice.isRead && (
              <span className="mt-0.5 size-2 flex-none rounded-full bg-blue-500" aria-label="Unread" />
            )}
            <h3 className={`text-sm ${!notice.isRead ? "font-semibold" : "font-medium"} text-neutral-900`}>
              {notice.title}
            </h3>
            {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
            {notice.attachments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <FileTextIcon className="size-3" />
                {notice.attachments.length}
              </span>
            )}
          </div>

          {/* Body preview — one line only, click to read full */}
          <p className="line-clamp-1 text-xs text-neutral-500">{notice.body}</p>

          {/* Meta */}
          <p className="text-xs text-neutral-400">
            {formatDate(notice.publishedAt)} · {notice.publishedByName}
          </p>
        </div>

        {/* Unacknowledged urgent indicator */}
        {notice.isUrgent && !notice.isAcknowledged && (
          <span className="flex-none rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Action required
          </span>
        )}
      </div>
    </li>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function StudentNoticePage() {
  const { success, error } = useToast();
  const [result, setResult] = useState<MyNoticesResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);
  const [newBanner, setNewBanner] = useState(0);
  const [openNotice, setOpenNotice] = useState<NoticeSummary | null>(null);

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

  const handleRead = useCallback((id: string) => {
    setResult((prev) => {
      const updated = prev.notices.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return { notices: updated, unreadCount: updated.filter((n) => !n.isRead).length };
    });
    // Also update the open dialog if it's for this notice
    setOpenNotice((prev) => (prev?.id === id ? { ...prev, isRead: true } : prev));
    studentNoticeApi.markRead(id).catch(() => {});
  }, []);

  const handleClickNotice = useCallback((notice: NoticeSummary) => {
    setOpenNotice(notice);
    // Mark as read when opened
    if (!notice.isRead) {
      handleRead(notice.id);
    }
  }, [handleRead]);

  const handleAcknowledge = useCallback(
    async (id: string) => {
      setResult((prev) => ({
        ...prev,
        notices: prev.notices.map((n) =>
          n.id === id ? { ...n, isRead: true, isAcknowledged: true } : n,
        ),
      }));
      setOpenNotice((prev) => (prev?.id === id ? { ...prev, isAcknowledged: true } : prev));
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
        setOpenNotice((prev) => (prev?.id === id ? { ...prev, isAcknowledged: false } : prev));
        error("Failed to acknowledge notice");
      }
    },
    [success, error, refresh],
  );

  const urgentCount = useMemo(
    () => result.notices.filter((n) => n.isUrgent).length,
    [result.notices],
  );
  const pendingAckCount = useMemo(
    () => result.notices.filter((n) => n.isUrgent && !n.isAcknowledged).length,
    [result.notices],
  );

  const table = useTable<NoticeSummary>({
    data: result.notices,
    pageSize: 10,
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

  const filterOptions = [
    { value: "UNREAD", label: `Unread (${result.unreadCount})` },
    { value: "URGENT", label: `Urgent (${urgentCount})` },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notices & Announcements"
        description="Click any notice to read it in full"
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="Total" value={loading ? "-" : String(result.notices.length)} icon={<BellIcon className="size-4" />} />
        <StatsCard label="Unread" value={loading ? "-" : String(result.unreadCount)} icon={<BellIcon className="size-4" />} />
        <StatsCard label="Urgent" value={loading ? "-" : String(urgentCount)} icon={<AlertTriangleIcon className="size-4" />} />
        <StatsCard label="Pending Ack." value={loading ? "-" : String(pendingAckCount)} icon={<CheckCircle2Icon className="size-4" />} />
      </section>

      {pendingAckCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangleIcon className="size-4 flex-none text-amber-500" />
          <p className="text-sm text-amber-700">
            You have <strong>{pendingAckCount}</strong> urgent{" "}
            {pendingAckCount === 1 ? "notice" : "notices"} requiring acknowledgement.
          </p>
        </div>
      )}

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown label="Filter" options={filterOptions} value={table.filter} onChange={table.setFilter} />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search notices…" />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
        {table.pageRows.length === 0 ? (
          <EmptyState
            icon={<BellIcon className="size-5" />}
            title="No notices found"
            description={
              table.query || table.filter
                ? "Try adjusting your search or filters."
                : "No notices have been published yet."
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {table.pageRows.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onRead={handleRead}
                onClick={handleClickNotice}
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

      {/* Full notice detail dialog */}
      <NoticeDetailDialog
        notice={openNotice}
        onClose={() => setOpenNotice(null)}
        onAcknowledge={(id) => void handleAcknowledge(id)}
      />
    </div>
  );
}

export default StudentNoticePage;
