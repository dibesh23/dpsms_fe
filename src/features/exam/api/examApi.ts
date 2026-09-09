import { apiClient } from "@/shared/lib/apiClient";
import type { ExamStatus } from "./studentExamApi";

// ── Config records ────────────────────────────────────────────────────────────

export interface ExamTypeRecord {
  id: string; // ExamType.id
  name: string; // ExamType.name
}

// ── Exams ─────────────────────────────────────────────────────────────────────

export interface ExamListItem {
  id: string; // Exam.id
  name: string; // Exam.name
  status: ExamStatus; // Exam.status
  examTypeName: string; // Exam.examType -> ExamType.name
  className: string; // Exam.class -> Class.name
  academicYearLabel: string; // Exam.academicYear -> AcademicYear.label
  termName: string | null; // Exam.term -> AcademicTerm.name
  subjectCount: number; // count of non-deleted ExamSubject rows
  subjectsEntered: number; // subjects with ENTERED/SUBMITTED/APPROVED status
  subjectsApproved: number; // subjects fully APPROVED
  createdAt: string; // Exam.createdAt
  updatedAt: string; // Exam.updatedAt (proxy for publish time)
}

export type ExamSubjectStatus = "NOT_ENTERED" | "ENTERED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface ExamDetailSubject {
  id: string; // ExamSubject.id
  subjectId: string; // Subject.id
  subjectName: string; // Subject.name
  subjectCode: string; // Subject.code
  fullMarksTheory: number; // ExamSubject.fullMarksTheory
  fullMarksPractical: number; // ExamSubject.fullMarksPractical
  passMarks: number; // ExamSubject.passMarks
  status: ExamSubjectStatus; // ExamSubject.status
  submittedByUserId: string | null; // ExamSubject.submittedByUserId
  submittedAt: string | null; // ExamSubject.submittedAt
  approvedByUserId: string | null; // ExamSubject.approvedByUserId
  approvedAt: string | null; // ExamSubject.approvedAt
  rejectedReason: string | null; // ExamSubject.rejectedReason
}

export interface ExamDetail {
  id: string; // Exam.id
  name: string; // Exam.name
  status: ExamStatus; // Exam.status
  examTypeId: string; // Exam.examTypeId
  examTypeName: string; // Exam.examType -> ExamType.name
  academicYearId: string; // Exam.academicYearId
  academicYearLabel: string; // Exam.academicYear -> AcademicYear.label
  classId: string; // Exam.classId
  className: string; // Exam.class -> Class.name
  termId: string | null; // Exam.termId
  termName: string | null; // Exam.term -> AcademicTerm.name
  subjects: ExamDetailSubject[];
}

// ── Marks register ────────────────────────────────────────────────────────────

export interface RegisterStudentRow {
  enrollmentId: string; // Enrollment.id
  studentId: string; // Student.id
  studentName: string; // Student.fullName
  admissionNumber: string; // Student.admissionNumber
  rollNumber: string; // Enrollment.rollNumber
  sectionName: string; // Section.name
  theoryMarks: number | null; // ExamResult.theoryMarks
  practicalMarks: number | null; // ExamResult.practicalMarks
  grade: string | null; // ExamResult.grade (auto NEB grade)
  gpaValue: number | null; // ExamResult.gpaValue (auto NEB grade point)
  isAbsent: boolean; // ExamResult.isAbsent
}

export interface MarksRegister {
  examId: string; // Exam.id
  examName: string; // Exam.name
  examStatus: ExamStatus; // Exam.status
  sectionId: string; // Section.id
  sectionName: string; // Section.name
  subjectId: string; // Subject.id
  subjectName: string; // Subject.name
  fullMarksTheory: number; // ExamSubject.fullMarksTheory
  fullMarksPractical: number; // ExamSubject.fullMarksPractical
  passMarks: number; // ExamSubject.passMarks
  subjectStatus: ExamSubjectStatus; // ExamSubject.status
  students: RegisterStudentRow[];
}

// ── Payloads ──────────────────────────────────────────────────────────────────

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
  // ---------- Exam types ----------
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

  // ---------- Exams ----------
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

  // ---------- Exam subjects ----------
  async addSubject(examId: string, payload: ExamSubjectInput): Promise<void> {
    await apiClient.post(`/exams/${examId}/subjects`, payload);
  },
  async removeSubject(examId: string, subjectId: string): Promise<void> {
    await apiClient.delete(`/exams/${examId}/subjects/${subjectId}`);
  },

  // ---------- Lifecycle ----------
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

  // ---------- Marks entry & approval ----------
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
