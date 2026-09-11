import { apiClient } from "@/shared/lib/apiClient";
import type { NoticeAttachment } from "./noticeApi";

export type { NoticeAttachment };

export interface NoticeSummary {
  id: string;
  title: string;
  body: string;
  isUrgent: boolean;
  publishedAt: string;
  publishedByName: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  isAcknowledged: boolean;
  attachments: NoticeAttachment[];
  recipientScopes: Array<{
    id: string;
    roleTarget: string | null;
    classId: string | null;
    sectionId: string | null;
  }>;
}

export interface MyNoticesResult {
  notices: NoticeSummary[];
  unreadCount: number;
}

export const studentNoticeApi = {
  async getNotices(): Promise<MyNoticesResult> {
    const { data } = await apiClient.get<{ data: MyNoticesResult }>("/notices/me");
    return data.data;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.post(`/notices/${id}/read`);
  },

  async acknowledge(id: string): Promise<void> {
    await apiClient.post(`/notices/${id}/acknowledge`);
  },
};

export default studentNoticeApi;
