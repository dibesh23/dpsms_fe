import { apiClient } from "@/shared/lib/apiClient";

export type ExamStatus = "DRAFT" | "MARKS_ENTRY" | "SUBMITTED" | "PUBLISHED" | "CANCELLED";
export type SubjectType = "COMPULSORY" | "ELECTIVE";

export interface ExamSubjectDetail {
  subjectId: string;
  subjectName: string;
  subjectType: SubjectType;
  theoryMarks: number | null;
  practicalMarks: number | null;
  fullMarksTheory: number;
  fullMarksPractical: number;
  passMarks: number;
  grade: string | null;
  gpaValue: number | null;
  isAbsent: boolean;
}

export interface ExamResultSummary {
  examId: string;
  examName: string;
  examTypeName: string;
  academicYearLabel: string;
  termName: string | null;
  status: ExamStatus;
  updatedAt: string;
  totalObtained: number;
  totalFullMarks: number;
  percentage: number;

  gpaValue: number | null;

  result: "PASS" | "FAIL";
  subjects: ExamSubjectDetail[];
}

export interface StudentExamSummary {
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  rollNumber: string;
  academicYearLabel: string;
  results: ExamResultSummary[];
}

export interface ReportCardData extends StudentExamSummary {}

export const studentExamApi = {
  async getResults(): Promise<StudentExamSummary> {
    const { data } = await apiClient.get<{ data: StudentExamSummary }>("/students/me/exam-results");
    return data.data;
  },
};

export default studentExamApi;
