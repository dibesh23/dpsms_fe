"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import {
  studentNoticeApi,
  type StudentNoticeSummary,
  type NoticeSummary,
  type NoticeAttachmentSummary,
  type NoticeScope,
} from "../api/studentNoticeApi";
import {
  AlertTriangleIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
} from "@/shared/components/ui/icons";

const SCOPE_LABEL: Record<NoticeScope, string> = {
  SCHOOL_WIDE: "School-wide",
  CLASS: "Class",
  SECTION: "Section",
};

const SCOPE_VARIANT: Record<NoticeScope, StatusVariant> = {
  SCHOOL_WIDE: "info",
  CLASS: "neutral",
  SECTION: "neutral",
};

const BODY_PREVIEW_LIMIT = 220;
const URGENT_FILTER_VALUE = "URGENT";

const EMPTY_SUMMARY: StudentNoticeSummary = {
  notices: [],
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentChip({ attachment }: { attachment: NoticeAttachmentSummary }) {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-bg-muted"
    >
      <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
      <span className="max-w-[160px] truncate font-medium text-neutral-700">
        {attachment.label}
      </span>
      <span className="text-neutral-400">{formatFileSize(attachment.sizeBytes)}</span>
    </a>
  );
}

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
          onClick={() => setExpanded((value) => !value)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
          {expanded ? (
            <ChevronUpIcon className="size-3.5" />
          ) : (
            <ChevronDownIcon className="size-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

function NoticeCard({ notice }: { notice: NoticeSummary }) {
  return (
    <li className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">{notice.title}</h3>
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" />}
          <StatusBadge
            status={notice.scopeLabel || SCOPE_LABEL[notice.scope]}
            variant={SCOPE_VARIANT[notice.scope]}
            dot={false}
          />
        </div>
        <p className="text-xs text-neutral-400">{formatDate(notice.publishedAt)}</p>
      </div>

      <p className="mt-1 text-xs text-neutral-400">Posted by {notice.publishedByName}</p>

      <div className="mt-3">
        <NoticeBody body={notice.body} />
      </div>

      {notice.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {notice.attachments.map((attachment) => (
            <AttachmentChip key={attachment.id} attachment={attachment} />
          ))}
        </div>
      )}
    </li>
  );
}

export function StudentNoticePage() {
  const [summary, setSummary] = useState<StudentNoticeSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await studentNoticeApi.getNotices();
      setSummary(data);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Notices are only ever visible once published; filtering
  // defensively here in case the API ever includes an unpublished one.
  const publishedNotices = useMemo(
    () => summary.notices.filter((notice) => Boolean(notice.publishedAt)),
    [summary.notices],
  );

  const table = useTable<NoticeSummary>({
    data: publishedNotices,
    pageSize: 6,
    getSearchText: (notice) => `${notice.title} ${notice.body} ${notice.publishedByName}`,
    filterMatch: (notice, value) =>
      value === URGENT_FILTER_VALUE ? notice.isUrgent : notice.scope === value,
    sortValue: (notice) => notice.publishedAt,
    defaultSortKey: "publishedAt",
  });

  const urgentCount = useMemo(
    () => publishedNotices.filter((notice) => notice.isUrgent).length,
    [publishedNotices],
  );

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return publishedNotices.filter((notice) => {
      const date = new Date(notice.publishedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [publishedNotices]);

  const withAttachmentsCount = useMemo(
    () => publishedNotices.filter((notice) => notice.attachments.length > 0).length,
    [publishedNotices],
  );

  const filterOptions = useMemo(() => {
    const scopeCounts = new Map<NoticeScope, number>();
    for (const notice of publishedNotices) {
      scopeCounts.set(notice.scope, (scopeCounts.get(notice.scope) ?? 0) + 1);
    }
    const options = [{ value: URGENT_FILTER_VALUE, label: `Urgent (${urgentCount})` }];
    for (const [scope, count] of scopeCounts) {
      options.push({ value: scope, label: `${SCOPE_LABEL[scope]} (${count})` });
    }
    return options;
  }, [publishedNotices, urgentCount]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notices & Announcements"
        description="Official notices published by the school"
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard
          label="Total Notices"
          value={loading ? "-" : String(publishedNotices.length)}
          icon={<BellIcon className="size-4" />}
        />
        <StatsCard
          label="Urgent"
          value={loading ? "-" : String(urgentCount)}
          icon={<AlertTriangleIcon className="size-4" />}
        />
        <StatsCard
          label="This Month"
          value={loading ? "-" : String(thisMonthCount)}
          icon={<BellIcon className="size-4" />}
        />
        <StatsCard
          label="With Attachments"
          value={loading ? "-" : String(withAttachmentsCount)}
          icon={<FileTextIcon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter"
          options={filterOptions}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search notices..."
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
        {table.pageRows.length === 0 ? (
          <EmptyState
            icon={<BellIcon className="size-5" />}
            title="No notices found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {table.pageRows.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
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
    </div>
  );
}

export default StudentNoticePage;