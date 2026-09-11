import { apiClient } from "@/shared/lib/apiClient";

export type NoticeApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface NoticeRecipientScope {
  id: string;
  roleTarget: string;
  classId: string;
  sectionId: string;
}

export interface NoticeAttachment {
  id: string;
  label: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

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
  attachments: NoticeAttachment[];
  recipientScopes: NoticeRecipientScope[];
}

export interface AdminNoticeListResult {
  items: AdminNotice[];
  total: number;
  page: number;
  pageSize: number;
}

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

export interface NoticeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "published" | "scheduled" | "draft";
  urgent?: boolean;
  approval?: NoticeApprovalStatus;
}

export interface NoticeCreatePayload {
  title: string;
  body: string;
  isUrgent?: boolean;
  scheduledAt?: string;
  recipientScopes?: Array<{
    roleTarget: string;
    classId?: string;
    sectionId?: string;
  }>;
}

export interface NoticeUpdatePayload {
  title?: string;
  body?: string;
  isUrgent?: boolean;
  scheduledAt?: string | null;
  recipientScopes?: Array<{
    roleTarget: string;
    classId?: string;
    sectionId?: string;
  }>;
}

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
    const { data } = await apiClient.get<{ data: { items: AdminNotice[] } }>(
      "/notices/submissions",
    );
    return { items: data.data.items, total: data.data.items.length, page: 1, pageSize: 100 };
  },

  async uploadAttachment(noticeId: string, file: File): Promise<NoticeAttachment> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<{ data: NoticeAttachment }>(
      `/notices/${noticeId}/attachments`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  async deleteAttachment(noticeId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/notices/${noticeId}/attachments/${attachmentId}`);
  },

  getAttachmentDownloadUrl(noticeId: string, attachmentId: string): string {
    return `${process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000"}/api/notices/${noticeId}/attachments/${attachmentId}/download`;
  },

  async fetchAttachmentBlob(
    noticeId: string,
    attachmentId: string,
  ): Promise<{ objectUrl: string; mimeType: string }> {
    const { data, headers } = await apiClient.get<Blob>(
      `/notices/${noticeId}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    const mimeType = (headers["content-type"] as string) || "application/octet-stream";
    const blob = new Blob([data], { type: mimeType });
    return { objectUrl: URL.createObjectURL(blob), mimeType };
  },

  async openAttachment(noticeId: string, attachmentId: string, label: string): Promise<void> {
    const { data, headers } = await apiClient.get<Blob>(
      `/notices/${noticeId}/attachments/${attachmentId}/download`,
      { responseType: "blob" },
    );
    const mimeType = (headers["content-type"] as string) || "application/octet-stream";
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.download = label;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};

export default noticeApi;

export function audienceLabel(scopes: NoticeRecipientScope[]): string {
  if (scopes.length === 0) return "Everyone";
  const roles = scopes.map((s) => s.roleTarget).filter(Boolean);
  const uniqueRoles = [...new Set(roles)];
  if (uniqueRoles.includes("ALL") || uniqueRoles.length === 0) return "Everyone";
  const roleLabel = uniqueRoles
    .map((r) => (r === "TEACHER" ? "Teachers" : r === "STUDENT" ? "Students" : r))
    .join(" & ");
  const hasClass = scopes.some((s) => s.classId);
  const hasSection = scopes.some((s) => s.sectionId);
  if (hasSection) return `${roleLabel} (specific section)`;
  if (hasClass) return `${roleLabel} (specific class)`;
  return roleLabel;
}
