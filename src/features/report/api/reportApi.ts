import { apiClient } from "@/shared/lib/apiClient";

export type ReportType = "EXAM" | "FEE" | "ATTENDANCE";
export type ReportFormat = "EXCEL" | "PDF";
export type ReportStatus =
  | "QUEUED"
  | "RUNNING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ReportParameterInput = Partial<{
  academicYearId: string;
  classId: string;
  sectionId: string;
  studentId: string;
  examId: string;
  fromDate: string;
  toDate: string;
}>;

export interface ReportRequestRecord {
  id: string;
  tenantId: string;
  type: ReportType;
  format: ReportFormat;
  parameters: ReportParameterInput;
  status: ReportStatus;
  requestedBy: { id: string; fullName: string };
  objectKey: string | null;
  provider: string | null;
  fileName: string | null;
  mimeType: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ReportListResult {
  items: ReportRequestRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportPreviewRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ReportPreview {
  detail: {
    id: string;
    type: ReportType;
    format: ReportFormat;
    fileName: string | null;
    requestedBy: { id: string; fullName: string };
    createdAt: string;
  };
  title: string;
  subtitle?: string;
  columns: { key: string; header: string }[];
  rows: ReportPreviewRow[];
}

export interface RequestReportInput {
  type: ReportType;
  format: ReportFormat;
  parameters: ReportParameterInput;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  FEE: "Fee Collection",
  ATTENDANCE: "Attendance",
  EXAM: "Exam Results",
};

export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  EXCEL: "Excel (.xlsx)",
  PDF: "PDF (.pdf)",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const reportApi = {
  async request(input: RequestReportInput): Promise<ReportRequestRecord> {
    const { data } = await apiClient.post<{ data: ReportRequestRecord }>("/reports/requests", input);
    return data.data;
  },

  async list(params: {
    page?: number;
    pageSize?: number;
    type?: ReportType;
    status?: ReportStatus;
  } = {}): Promise<ReportListResult> {
    const query = Object.fromEntries(
      (Object.entries(params) as [string, string | number | undefined][]).filter(
        ([, value]) => value !== undefined && value !== "",
      ),
    );
    const { data } = await apiClient.get<{ data: ReportListResult }>("/reports/requests", {
      params: query,
    });
    return data.data;
  },

  async get(id: string): Promise<ReportRequestRecord> {
    const { data } = await apiClient.get<{ data: ReportRequestRecord }>(`/reports/requests/${id}`);
    return data.data;
  },

  async preview(id: string): Promise<ReportPreview> {
    const { data } = await apiClient.get<{ data: ReportPreview }>(`/reports/requests/${id}/preview`);
    return data.data;
  },

  async download(id: string): Promise<void> {
    const response = await apiClient.get<Blob>(`/reports/requests/${id}/download`, {
      responseType: "blob",
    });
    const disposition = String(response.headers["content-disposition"] ?? "");
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "report";
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