"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { pushNotification } from "@/shared/components/ui/NotificationPopup";
import { useNoticePolling } from "../hooks/useNoticePolling";

export function NoticeNotifier() {
  const { user } = useAuth();
  const isRecipient = user?.role === "STUDENT" || user?.role === "TEACHER";

  useNoticePolling({
    enabled: isRecipient,
    onNewNotices: (_count, newNotices) => {
      for (const n of newNotices) {
        pushNotification(
          n.isUrgent ? "urgent-notice" : "notice",
          n.isUrgent ? "Urgent Notice" : "New Notice",
          n.title,
        );
      }
    },
    onRefresh: () => {},
  });

  return null;
}
