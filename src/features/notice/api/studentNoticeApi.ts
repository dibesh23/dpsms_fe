import { apiClient } from "@/shared/lib/apiClient";

// ── Notice summary for recipient feed ─────────────────────────────────────────

export interface NoticeSummary {
  id: string;
  title: string;
  body: string;
  isUrgent: boolean;
  publishedAt: string;   // always set in the published feed (/notices/me filters to publishedAt != null)
  publishedByName: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  isAcknowledged: boolean;
}

export interface MyNoticesResult {
  notices: NoticeSummary[];
  unreadCount: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const studentNoticeApi = {
  /** GET /api/notices/me — published notices for the logged-in user's tenant */
  async getNotices(): Promise<MyNoticesResult> {
    const { data } = await apiClient.get<{ data: MyNoticesResult }>("/notices/me");
    return data.data;
  },

  /** POST /api/notices/:id/read — mark a notice as read (idempotent) */
  async markRead(id: string): Promise<void> {
    await apiClient.post(`/notices/${id}/read`);
  },

  /** POST /api/notices/:id/acknowledge — acknowledge an urgent notice */
  async acknowledge(id: string): Promise<void> {
    await apiClient.post(`/notices/${id}/acknowledge`);
  },
};

export default studentNoticeApi;
