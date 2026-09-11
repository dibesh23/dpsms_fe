import { apiClient } from "@/shared/lib/apiClient";
import type { AttachmentItem, AssignmentStatus, SubmissionStatus } from "./assignmentApi";

export interface StudentAssignmentListItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: AssignmentStatus;
  sectionName: string;
  className: string;
  subjectName: string | null;
  submissionStatus: SubmissionStatus;
  submittedAt: string | null;
  isLate: boolean;
  marks: number | null;
}

export interface StudentSubmissionDetail {
  submissionId: string;
  status: SubmissionStatus;
  content: string | null;
  submittedAt: string | null;
  isLate: boolean;
  marks: number | null;
  feedback: string | null;
  attachments: AttachmentItem[];
}

export interface StudentAssignmentDetail {
  id: string;
  title: string;
  description: string | null;
  instructions: string;
  dueDate: string;
  status: AssignmentStatus;
  createdAt: string;
  section: { id: string; name: string; className: string };
  subject: { id: string; name: string } | null;
  attachments: AttachmentItem[];
  submission: StudentSubmissionDetail | null;
}

export interface SubmissionAttachment {
  id: string;
  label: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const studentAssignmentApi = {
  async list(params?: {
    page?: number;
    pageSize?: number;
    status?: AssignmentStatus;
    includeGraded?: boolean;
  }): Promise<ListResult<StudentAssignmentListItem>> {
    const { data } = await apiClient.get<{ data: ListResult<StudentAssignmentListItem> }>(
      "/assignments/me",
      { params },
    );
    return data.data;
  },

  async get(id: string): Promise<StudentAssignmentDetail> {
    const { data } = await apiClient.get<{ data: StudentAssignmentDetail }>(`/assignments/${id}`);
    return data.data;
  },

  async submit(
    id: string,
    payload: { content: string; attachmentIds?: string[] },
  ): Promise<{ submissionId: string; isLate: boolean }> {
    const { data } = await apiClient.post<{ data: { submissionId: string; isLate: boolean } }>(
      `/assignments/${id}/submit`,
      payload,
    );
    return data.data;
  },

  async uploadSubmissionAttachment(
    id: string,
    submissionId: string,
    file: File,
  ): Promise<SubmissionAttachment> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<{ data: SubmissionAttachment }>(
      `/assignments/${id}/submissions/${submissionId}/attachments`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  async openAssignmentAttachment(id: string, attachmentId: string, label: string): Promise<void> {
    const { data, headers } = await apiClient.get<Blob>(
      `/assignments/${id}/attachments/${attachmentId}/download`,
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

export default studentAssignmentApi;
