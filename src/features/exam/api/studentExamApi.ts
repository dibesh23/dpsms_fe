import { apiClient } from "@/shared/lib/apiClient";

// Mirrors schema.prisma
export type ExamStatus = "DRAFT" | "RESULTS_PENDING_APPROVAL" | "PUBLISHED";
export type SubjectType = "COMPULSORY" | "ELECTIVE";

export interface ExamSubjectDetail {
  subjectId: string; // Subject.id
  subjectName: string; // Subject.name
  subjectType: SubjectType; // Subject.type
  theoryMarks: number | null; // ExamResult.theoryMarks
  practicalMarks: number | null; // ExamResult.practicalMarks
  fullMarksTheory: number; // ExamSubject.fullMarksTheory
  fullMarksPractical: number; // ExamSubject.fullMarksPractical
  passMarks: number; // ExamSubject.passMarks
  grade: string | null; // ExamResult.gradeScale -> GradeScale.grade
  gpaValue: number | null; // GradeScale.gpaValue
}

export interface ExamResultSummary {
  examId: string; // Exam.id
  examName: string; // Exam.name
  examTypeName: string; // Exam.examType -> ExamType.name
  academicYearLabel: string; // Exam.academicYear -> AcademicYear.label
  termName: string | null; // Exam.term -> AcademicTerm.name
  status: ExamStatus; // Exam.status
  totalObtained: number; // sum of (theoryMarks + practicalMarks) across subjects
  totalFullMarks: number; // sum of (fullMarksTheory + fullMarksPractical) across subjects
  percentage: number;
  /** Derived client-side isn't safe here (needs per-subject pass marks
   *  from every ExamSubject), so the backend computes it: PASS only if
   *  every subject's obtained marks meet that subject's passMarks. */
  result: "PASS" | "FAIL";
  subjects: ExamSubjectDetail[];
}

export interface StudentExamSummary {
  academicYearLabel: string;
  results: ExamResultSummary[];
}

export const studentExamApi = {
  async getResults(): Promise<StudentExamSummary> {
    const { data } = await apiClient.get<{ data: StudentExamSummary }>("/students/me/exam-results");
    return data.data;
  },
};

export default studentExamApi;