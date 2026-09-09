"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { noticeApi } from "../api/noticeApi";
import { useNoticePolling } from "../hooks/useNoticePolling";
import { GraduationCapIcon, AlertTriangleIcon, BellIcon } from "@/shared/components/ui/icons";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { useExamPolling } from "@/features/exam/hooks/useExamPolling";
import { usePublishedExamsPolling } from "@/features/exam/hooks/usePublishedExamsPolling";

type BellKind = "notice" | "exam";

interface BellNotice {
  id: string;
  kind: BellKind;
  title: string;
  subtitle?: string;
  isUrgent: boolean;
  isRead: boolean;
  publishedAt: string;
  href: string;
}

export function useNoticeBell() {
  const { user } = useAuth();
  const isRecipient = user?.role === "STUDENT" || user?.role === "TEACHER";
  const isStudent = user?.role === "STUDENT";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "PRINCIPAL";
  const canSeePublishedExams = isStudent || isAdmin || user?.role === "TEACHER";
  const [notices, setNotices] = useState<BellNotice[]>([]);
  const [unread, setUnread] = useState(0);

  const mergeExam = useCallback((exam: {
    id: string;
    updatedAt: string;
    subtitle: string;
    href: string;
  }) => {
    setNotices((prev) => {
      if (prev.some((n) => n.kind === "exam" && n.id === exam.id)) return prev;
      const entry: BellNotice = {
        id: exam.id,
        kind: "exam",
        title: "Exam Result Published",
        subtitle: exam.subtitle,
        isUrgent: false,
        isRead: true,
        publishedAt: exam.updatedAt,
        href: exam.href,
      };
      return [entry, ...prev];
    });
  }, []);

  // ── Recipients (student / teacher): /notices/me feed ────────────────────────
  const { refresh: refreshRecipient } = useNoticePolling({
    enabled: isRecipient,
    onNewNotices: (count) => setUnread((prev) => prev + count),
    onRefresh: (data) => {
      setNotices((prev) => {
        const noticeEntries: BellNotice[] = data.notices.slice(0, 6).map((n) => ({
          id: n.id,
          kind: "notice",
          title: n.title,
          isUrgent: n.isUrgent,
          isRead: n.isRead,
          publishedAt: n.publishedAt,
          href: "/notices",
        }));
        const examEntries = prev.filter((n) => n.kind === "exam");
        return [...noticeEntries, ...examEntries];
      });
      setUnread(data.unreadCount);
    },
  });

  // ── Exam result notifications for students / teachers ───────────────────────
  const { refresh: refreshExams } = useExamPolling({
    enabled: isStudent,
    onNewResults: () => {},
    onRefresh: (published) => {
      for (const r of published) {
        const label = r.termName ? `${r.examName} (${r.termName})` : r.examName;
        mergeExam({
          id: r.examId,
          updatedAt: r.updatedAt,
          subtitle: `${label} — ${r.percentage.toFixed(1)}% · ${r.result}`,
          href: "/report-card",
        });
      }
    },
  });

  const { refresh: refreshPublishedExams } = usePublishedExamsPolling({
    enabled: canSeePublishedExams && !isStudent,
    onNewExams: () => {},
    onRefresh: (exams) => {
      for (const e of exams) {
        mergeExam({
          id: e.id,
          updatedAt: e.updatedAt,
          subtitle: `${e.name} — Class ${e.className}`,
          href: "/exams",
        });
      }
    },
  });

  // ── Admins: published notice list ─────────────────────────────────────────────
  const loadAdmin = useCallback(async () => {
    try {
      const result = await noticeApi.list({ status: "published", pageSize: 6 });
      setNotices((prev) => {
        const noticeEntries: BellNotice[] = result.items.map((n) => ({
          id: n.id,
          kind: "notice",
          title: n.title,
          isUrgent: n.isUrgent,
          isRead: true,
          publishedAt: n.publishedAt ?? n.createdAt,
          href: "/notices",
        }));
        const examEntries = prev.filter((n) => n.kind === "exam");
        return [...noticeEntries, ...examEntries];
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (isRecipient) return;
    const initialId = setTimeout(() => void loadAdmin(), 0);
    const id = setInterval(() => void loadAdmin(), 30_000);
    return () => {
      clearTimeout(initialId);
      clearInterval(id);
    };
  }, [isRecipient, loadAdmin]);

  const refresh = useCallback(() => {
    if (isRecipient) refreshRecipient();
    else void loadAdmin();
    if (isStudent) refreshExams();
    else if (canSeePublishedExams) refreshPublishedExams();
  }, [
    isRecipient,
    isStudent,
    canSeePublishedExams,
    refreshRecipient,
    refreshExams,
    refreshPublishedExams,
    loadAdmin,
  ]);

  return { notices, unread, refresh };
}

const DEFAULT_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50";

/**
 * Header notification bell that opens a dropdown with the latest notices and,
 * for students/teachers, newly published exam results. Polls every 30s like
 * the rest of the notification system.
 */
export function NoticeBell({ buttonClassName }: { buttonClassName?: string }) {
  const { notices, unread, refresh } = useNoticeBell();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click / Escape ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) void refresh();
      return !prev;
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={handleToggle}
        className={cn(DEFAULT_BUTTON_CLASS, buttonClassName)}
      >
        <BellIcon className="size-4" />
        {unread > 0 && (
          <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[60] w-80 overflow-hidden rounded-lg border border-neutral-200 bg-bg-default shadow-xl animate-scale-in">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">Notifications</p>
            {unread > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                {unread} unread
              </span>
            )}
          </div>

          <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
            {notices.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-neutral-400">
                {unread > 0 ? "Loading…" : "No notifications yet"}
              </li>
            ) : (
              [...notices]
                .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
                .slice(0, 6)
                .map((n) => (
                  <li key={`${n.kind}-${n.id}-${n.publishedAt}`}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
                    >
                      <span className="mt-0.5 flex-none">
                        {n.kind === "exam" ? (
                          <GraduationCapIcon className="size-4 text-emerald-600" />
                        ) : n.isUrgent ? (
                          <AlertTriangleIcon className="size-4 text-red-500" />
                        ) : (
                          <BellIcon className="size-4 text-neutral-400" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm",
                            n.isRead
                              ? "font-medium text-neutral-700"
                              : "font-semibold text-neutral-900",
                          )}
                        >
                          {n.title}
                        </p>
                        {n.subtitle && (
                          <p className="truncate text-xs text-neutral-500">{n.subtitle}</p>
                        )}
                        <p className="text-xs text-neutral-400">{formatDate(n.publishedAt)}</p>
                      </div>
                      {!n.isRead && !n.isUrgent && (
                        <span className="mt-1.5 size-1.5 flex-none rounded-full bg-violet-500" />
                      )}
                    </Link>
                  </li>
                ))
            )}
          </ul>

          <Link
            href="/notices"
            onClick={() => setOpen(false)}
            className="block border-t border-neutral-100 px-4 py-2.5 text-center text-xs font-medium text-violet-600 hover:bg-neutral-50"
          >
            View all notices
          </Link>
        </div>
      )}
    </div>
  );
}
