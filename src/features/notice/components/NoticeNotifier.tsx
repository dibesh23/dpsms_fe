"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { pushNotification } from "@/shared/components/ui/NotificationPopup";
import { useNoticePolling } from "../hooks/useNoticePolling";

/**
 * Global, layout-level notifier for published notices.
 * Mounted once in the root layout so a popup fires on any page whenever a
 * new notice is published to the current user — urgent and regular alike.
 * Urgent notices keep the red alert styling; regular ones use a neutral blue.
 */
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
