import { apiClient } from "@/shared/lib/apiClient";

// ── Approval status ───────────────────────────────────────────────────────────

export type NoticeApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

// ── Notice record ─────────────────────────────────────────────────────────────

export interface AdminNotice {
  id: string;
  title: string;
  body: string;
  isUrgent: boolean;
  approvalStatus: NoticeApprovalStatus;
  approvalNote: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  publishedByName: string;
  publishedByUserId: string;
  approvedByName: string | null;
  approvedByUserId: string | null;
}

export interface AdminNoticeListResult {
  items: AdminNotice[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Read tracking ─────────────────────────────────────────────────────────────

export interface NoticeReadRecord {
  userId: string;
  fullName: string;
  readAt: string;
  acknowledgedAt: string | null;
}

export interface NoticeReadsResult {
  noticeId: string;
  title: string;
  totalReads: number;
  totalAcknowledged: number;
  reads: NoticeReadRecord[];
}

// ── Query params ──────────────────────────────────────────────────────────────

export interface NoticeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "published" | "scheduled" | "draft";
  urgent?: boolean;
  approval?: NoticeApprovalStatus;
}

// ── Create / update payloads ──────────────────────────────────────────────────

export interface NoticeCreatePayload {
  title: string;
  body: string;
  isUrgent?: boolean;
  scheduledAt?: string;
}

export interface NoticeUpdatePayload {
  title?: string;
  body?: string;
  isUrgent?: boolean;
  scheduledAt?: string | null;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const noticeApi = {
  async list(params?: NoticeListParams): Promise<AdminNoticeListResult> {
    const { data } = await apiClient.get<{ data: AdminNoticeListResult }>("/notices", { params });
    return data.data;
  },

  async get(id: string): Promise<AdminNotice> {
    const { data } = await apiClient.get<{ data: AdminNotice }>(`/notices/${id}`);
    return data.data;
  },

  async create(payload: NoticeCreatePayload): Promise<AdminNotice> {
    const { data } = await apiClient.post<{ data: AdminNotice }>("/notices", payload);
    return data.data;
  },

  async update(id: string, payload: NoticeUpdatePayload): Promise<AdminNotice> {
    const { data } = await apiClient.patch<{ data: AdminNotice }>(`/notices/${id}`, payload);
    return data.data;
  },

  async publish(id: string): Promise<AdminNotice> {
    const { data } = await apiClient.post<{ data: AdminNotice }>(`/notices/${id}/publish`);
    return data.data;
  },

  async approve(id: string): Promise<AdminNotice> {
    const { data } = await apiClient.post<{ data: AdminNotice }>(`/notices/${id}/approve`);
    return data.data;
  },

  async reject(id: string, note: string): Promise<AdminNotice> {
    const { data } = await apiClient.post<{ data: AdminNotice }>(`/notices/${id}/reject`, { note });
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notices/${id}`);
  },

  async getReads(id: string): Promise<NoticeReadsResult> {
    const { data } = await apiClient.get<{ data: NoticeReadsResult }>(`/notices/${id}/reads`);
    return data.data;
  },

  async getPendingCount(): Promise<number> {
    const { data } = await apiClient.get<{ data: { count: number } }>("/notices/pending-count");
    return data.data.count;
  },

  async getMySubmissions(): Promise<AdminNoticeListResult> {
    const { data } = await apiClient.get<{ data: { items: AdminNotice[] } }>("/notices/submissions");
    return { items: data.data.items, total: data.data.items.length, page: 1, pageSize: 100 };
  },
};

export default noticeApi;
