import { apiClient } from "@/shared/lib/apiClient";
import type { ExamStatus } from "./studentExamApi";

export interface ExamTypeRecord {
  id: string;
  name: string;
}

export interface ExamListItem {
  id: string;
  name: string;
  status: ExamStatus;
  examTypeName: string;
  className: string;
  academicYearLabel: string;
  termName: string | null;
  subjectCount: number;
  subjectsEntered: number;
  subjectsApproved: number;
  createdAt: string;
  updatedAt: string;
}

export type ExamSubjectStatus = "NOT_ENTERED" | "ENTERED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface ExamDetailSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  fullMarksTheory: number;
  fullMarksPractical: number;
  passMarks: number;
  status: ExamSubjectStatus;
  submittedByUserId: string | null;
  submittedAt: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
}

export interface ExamDetail {
  id: string;
  name: string;
  status: ExamStatus;
  examTypeId: string;
  examTypeName: string;
  academicYearId: string;
  academicYearLabel: string;
  classId: string;
  className: string;
  termId: string | null;
  termName: string | null;
  subjects: ExamDetailSubject[];
}

export interface RegisterStudentRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  sectionName: string;
  theoryMarks: number | null;
  practicalMarks: number | null;
  grade: string | null;
  gpaValue: number | null;
  isAbsent: boolean;
}

export interface MarksRegister {
  examId: string;
  examName: string;
  examStatus: ExamStatus;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  fullMarksTheory: number;
  fullMarksPractical: number;
  passMarks: number;
  subjectStatus: ExamSubjectStatus;
  students: RegisterStudentRow[];
}

export interface ExamSubjectInput {
  subjectId: string;
  fullMarksTheory: number;
  fullMarksPractical?: number;
  passMarks: number;
}

export interface ExamCreatePayload {
  examTypeId: string;
  academicYearId?: string;
  classId: string;
  termId?: string | null;
  name: string;
  subjects?: ExamSubjectInput[];
}

export interface EnterMarksPayload {
  sectionId: string;
  subjectId: string;
  results: Array<{
    enrollmentId: string;
    theoryMarks?: number | null;
    practicalMarks?: number | null;
    isAbsent?: boolean;
  }>;
}

interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const examApi = {
  async listExamTypes(): Promise<ExamTypeRecord[]> {
    const { data } = await apiClient.get<{ data: ExamTypeRecord[] }>("/exam-types");
    return data.data;
  },
  async createExamType(payload: { name: string }): Promise<ExamTypeRecord> {
    const { data } = await apiClient.post<{ data: ExamTypeRecord }>("/exam-types", payload);
    return data.data;
  },
  async updateExamType(id: string, payload: { name: string }): Promise<ExamTypeRecord> {
    const { data } = await apiClient.patch<{ data: ExamTypeRecord }>(`/exam-types/${id}`, payload);
    return data.data;
  },
  async deleteExamType(id: string): Promise<void> {
    await apiClient.delete(`/exam-types/${id}`);
  },

  async listExams(query?: {
    status?: ExamStatus;
    academicYearId?: string;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }): Promise<ExamListItem[]> {
    const { data } = await apiClient.get<{ data: ListResult<ExamListItem> }>("/exams", {
      params: query,
    });
    return data.data.items;
  },
  async getExam(id: string): Promise<ExamDetail> {
    const { data } = await apiClient.get<{ data: ExamDetail }>(`/exams/${id}`);
    return data.data;
  },
  async createExam(payload: ExamCreatePayload): Promise<{ id: string }> {
    const { data } = await apiClient.post<{ data: { id: string } }>("/exams", payload);
    return data.data;
  },
  async updateExam(
    id: string,
    payload: { name?: string; examTypeId?: string; termId?: string | null },
  ): Promise<void> {
    await apiClient.patch(`/exams/${id}`, payload);
  },
  async deleteExam(id: string): Promise<void> {
    await apiClient.delete(`/exams/${id}`);
  },

  async addSubject(examId: string, payload: ExamSubjectInput): Promise<void> {
    await apiClient.post(`/exams/${examId}/subjects`, payload);
  },
  async removeSubject(examId: string, subjectId: string): Promise<void> {
    await apiClient.delete(`/exams/${examId}/subjects/${subjectId}`);
  },

  async startExam(id: string): Promise<void> {
    await apiClient.post(`/exams/${id}/start`);
  },
  async cancelExam(id: string): Promise<void> {
    await apiClient.post(`/exams/${id}/cancel`);
  },
  async publishExam(id: string): Promise<void> {
    await apiClient.post(`/exams/${id}/publish`);
  },
  async reopenExam(id: string): Promise<void> {
    await apiClient.post(`/exams/${id}/reopen`);
  },

  async getMarksRegister(
    examId: string,
    params: { sectionId: string; subjectId: string },
  ): Promise<MarksRegister> {
    const { data } = await apiClient.get<{ data: MarksRegister }>(
      `/exams/${examId}/marks-register`,
      { params },
    );
    return data.data;
  },
  async enterMarks(examId: string, payload: EnterMarksPayload): Promise<void> {
    await apiClient.put(`/exams/${examId}/marks`, payload);
  },
  async submitSubject(examId: string, subjectId: string): Promise<void> {
    await apiClient.post(`/exams/${examId}/subjects/${subjectId}/submit`);
  },
  async approveSubject(examId: string, subjectId: string): Promise<void> {
    await apiClient.post(`/exams/${examId}/subjects/${subjectId}/approve`);
  },
  async rejectSubject(examId: string, subjectId: string, reason: string): Promise<void> {
    await apiClient.post(`/exams/${examId}/subjects/${subjectId}/reject`, { reason });
  },
};

export default examApi;
