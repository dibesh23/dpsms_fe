import { apiClient } from "@/shared/lib/apiClient";

export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AuditStatus = "SUCCESS" | "FAILURE";

export interface AuditLogRecord {
  id: string;
  tenantId: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  eventType: string;
  category: string;
  severity: AuditSeverity;
  status: AuditStatus;
  resourceType: string | null;
  resourceId: string | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  errorCode: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  eventType?: string;
  category?: string;
  severity?: AuditSeverity;
  status?: AuditStatus;
}

export interface AuditLogListResult {
  items: AuditLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

function compactFilters(filters: AuditLogFilters): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""),
  ) as Record<string, string | number>;
}

export const auditApi = {
  async list(filters: AuditLogFilters): Promise<AuditLogListResult> {
    const { data } = await apiClient.get<{ data: AuditLogListResult }>("/audit-logs", {
      params: compactFilters(filters),
    });
    return data.data;
  },

  async exportCsv(filters: Omit<AuditLogFilters, "page" | "pageSize">): Promise<void> {
    const response = await apiClient.get<Blob>("/audit-logs/export", {
      params: compactFilters(filters),
      responseType: "blob",
    });
    const disposition = String(response.headers["content-disposition"] ?? "");
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "audit-logs.csv";
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};
