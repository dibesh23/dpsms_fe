"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { formatDate } from "@/shared/lib/format";
import { type NoticeSummary } from "../api/studentNoticeApi";
import {
  noticeApi,
  type AdminNotice,
  type NoticeRecipientScope,
  audienceLabel,
} from "../api/noticeApi";
import { useNoticePolling } from "../hooks/useNoticePolling";
import { AlertTriangleIcon, BellIcon } from "@/shared/components/ui/icons";

interface WidgetNotice {
  id: string;
  title: string;
  body: string;
  isUrgent: boolean;
  publishedAt: string;
  isRead: boolean;
  recipientScopes: NoticeRecipientScope[];
}

function toWidgetNotice(n: NoticeSummary): WidgetNotice {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    isUrgent: n.isUrgent,
    publishedAt: n.publishedAt,
    isRead: n.isRead,
    recipientScopes: n.recipientScopes ?? [],
  };
}

function adminToWidgetNotice(n: AdminNotice): WidgetNotice {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    isUrgent: n.isUrgent,
    publishedAt: n.publishedAt ?? n.createdAt,
    isRead: true,
    recipientScopes: n.recipientScopes ?? [],
  };
}

function sortByNewest<T extends { publishedAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function NoticeRow({ notice }: { notice: WidgetNotice }) {
  const audience = audienceLabel(notice.recipientScopes);
  return (
    <li className="flex items-start gap-3 py-2.5">
      <div className="mt-1 flex size-7 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle">
        {notice.isUrgent ? (
          <AlertTriangleIcon className="size-3.5 text-red-500" />
        ) : (
          <BellIcon
            className={`size-3.5 ${!notice.isRead ? "text-blue-500" : "text-neutral-400"}`}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {!notice.isRead && <span className="size-1.5 flex-none rounded-full bg-blue-500" />}
          <p
            className={`truncate text-sm ${!notice.isRead ? "font-semibold text-neutral-900" : "font-medium text-neutral-700"}`}
          >
            {notice.title}
          </p>
          {notice.isUrgent && <StatusBadge status="Urgent" variant="danger" dot={false} />}
          {audience !== "Everyone" && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              {audience}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{notice.body}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{formatDate(notice.publishedAt)}</p>
      </div>
    </li>
  );
}

interface Props {
  role: string;
  limit?: number;
}

export function DashboardNoticesWidget({ role, limit = 5 }: Props) {
  const isAdmin = role === "SUPER_ADMIN" || role === "PRINCIPAL";
  const [notices, setNotices] = useState<WidgetNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const knownAdminIdsRef = useRef<Set<string> | null>(null);

  const loadAdmin = useCallback(async () => {
    try {
      const result = await noticeApi.list({ pageSize: limit, status: "published" });
      const sorted = sortByNewest(result.items.map(adminToWidgetNotice));
      const freshIds = new Set(sorted.map((n) => n.id));
      if (knownAdminIdsRef.current === null) {
        knownAdminIdsRef.current = freshIds;
      } else {
        const newCount = [...freshIds].filter((id) => !knownAdminIdsRef.current!.has(id)).length;
        if (newCount > 0) setHasNew(true);
        knownAdminIdsRef.current = freshIds;
      }
      setNotices(sorted);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAdmin();
    const id = setInterval(() => void loadAdmin(), 30_000);
    return () => clearInterval(id);
  }, [isAdmin, loadAdmin]);

  useNoticePolling({
    enabled: !isAdmin,
    onNewNotices: (count) => {
      setHasNew(true);
      setUnreadCount((prev) => prev + count);
    },
    onRefresh: (data) => {
      const sorted = sortByNewest(data.notices.map(toWidgetNotice)).slice(0, limit);
      setNotices(sorted);
      setUnreadCount(data.unreadCount);
      setLoading(false);
    },
  });

  const urgentCount = useMemo(() => notices.filter((n) => n.isUrgent).length, [notices]);

  return (
    <DashboardWidget
      title={
        <span className="flex items-center gap-2">
          Notices
          {hasNew && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
          )}
        </span>
      }
      description={
        loading
          ? "Loading…"
          : unreadCount > 0
            ? `${unreadCount} unread${urgentCount > 0 ? ` · ${urgentCount} urgent` : ""}`
            : urgentCount > 0
              ? `${urgentCount} urgent`
              : "All caught up"
      }
      action={
        <Link
          href="/notices"
          className="text-xs font-medium text-brand-default transition-colors hover:text-brand-hover hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-default"
          onClick={() => setHasNew(false)}
        >
          View all
        </Link>
      }
    >
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="size-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600" />
        </div>
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="size-5" />}
          title="No notices yet"
          description="Notices published by the school will appear here."
          className="py-6"
        />
      ) : (
        <ul className="divide-y divide-neutral-100">
          {notices.map((notice) => (
            <NoticeRow key={notice.id} notice={notice} />
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}

export default DashboardNoticesWidget;
