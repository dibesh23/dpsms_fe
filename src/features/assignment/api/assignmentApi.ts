import { apiClient } from "@/shared/lib/apiClient";

export type AssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type SubmissionStatus = "NOT_STARTED" | "SUBMITTED" | "GRADED";

export interface AttachmentItem {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  label: string;
}

export interface AssignmentListItem {
  id: string;
  title: string;
  status: AssignmentStatus;
  description: string | null;
  dueDate: string;
  sectionName: string;
  className: string;
  subjectName: string | null;
  teacherName: string;
  studentCount: number;
  createdAt: string;
}

export interface AssignmentDetail {
  id: string;
  title: string;
  description: string | null;
  instructions: string;
  dueDate: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  section: { id: string; name: string; className: string };
  subject: { id: string; name: string } | null;
  teacher: { id: string; fullName: string };
  attachments: AttachmentItem[];
}

export interface SubmissionRowItem {
  submissionId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  status: SubmissionStatus;
  content: string | null;
  submittedAt: string | null;
  isLate: boolean;
  marks: number | null;
  feedback: string | null;
  attachmentCount: number;
}

export interface SubmissionDetail {
  submissionId: string;
  assignmentId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: SubmissionStatus;
  content: string | null;
  submittedAt: string | null;
  isLate: boolean;
  marks: number | null;
  feedback: string | null;
  markedAt: string | null;
  attachments: AttachmentItem[];
}

export interface AssignmentCreatePayload {
  sectionId: string;
  subjectId?: string;
  title: string;
  description?: string;
  instructions: string;
  dueDate: string;
}

export type AssignmentUpdatePayload = Partial<AssignmentCreatePayload> & {
  status?: AssignmentStatus;
};

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const assignmentApi = {
  async list(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sectionId?: string;
    status?: AssignmentStatus;
  }): Promise<ListResult<AssignmentListItem>> {
    const { data } = await apiClient.get<{ data: ListResult<AssignmentListItem> }>("/assignments", {
      params,
    });
    return data.data;
  },

  async get(id: string): Promise<AssignmentDetail> {
    const { data } = await apiClient.get<{ data: AssignmentDetail }>(`/assignments/${id}`);
    return data.data;
  },

  async create(payload: AssignmentCreatePayload): Promise<{ id: string }> {
    const { data } = await apiClient.post<{ data: { id: string } }>("/assignments", payload);
    return data.data;
  },

  async update(id: string, payload: AssignmentUpdatePayload): Promise<AssignmentDetail> {
    const { data } = await apiClient.patch<{ data: AssignmentDetail }>(
      `/assignments/${id}`,
      payload,
    );
    return data.data;
  },

  async publish(id: string): Promise<AssignmentDetail> {
    const { data } = await apiClient.post<{ data: AssignmentDetail }>(`/assignments/${id}/publish`);
    return data.data;
  },

  async close(id: string): Promise<AssignmentDetail> {
    const { data } = await apiClient.post<{ data: AssignmentDetail }>(`/assignments/${id}/close`);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/assignments/${id}`);
  },

  async listSubmissions(id: string): Promise<ListResult<SubmissionRowItem>> {
    const { data } = await apiClient.get<{ data: ListResult<SubmissionRowItem> }>(
      `/assignments/${id}/submissions`,
    );
    return data.data;
  },

  async getSubmission(id: string, submissionId: string): Promise<SubmissionDetail> {
    const { data } = await apiClient.get<{ data: SubmissionDetail }>(
      `/assignments/${id}/submissions/${submissionId}`,
    );
    return data.data;
  },

  async grade(
    id: string,
    submissionId: string,
    payload: { marks: number; feedback?: string },
  ): Promise<void> {
    await apiClient.post(`/assignments/${id}/submissions/${submissionId}/grade`, payload);
  },

  async uploadAttachment(id: string, file: File): Promise<AttachmentItem> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<{ data: AttachmentItem }>(
      `/assignments/${id}/attachments`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/assignments/${id}/attachments/${attachmentId}`);
  },

  async openAttachment(id: string, attachmentId: string, label: string): Promise<void> {
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

  async openSubmissionAttachment(
    id: string,
    submissionId: string,
    attachmentId: string,
    label: string,
  ): Promise<void> {
    const { data, headers } = await apiClient.get<Blob>(
      `/assignments/${id}/submissions/${submissionId}/attachments/${attachmentId}/download`,
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

export default assignmentApi;
