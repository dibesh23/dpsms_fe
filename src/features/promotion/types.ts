export type PromotionOutcome =
  | "PROMOTED"
  | "REPEATER"
  | "FAILED"
  | "HELD"
  | "TRANSFERRED_OUT"
  | "WITHDRAWN"
  | "EXCLUDED";

export type ReviewDecision = "REPEATER" | "PROMOTE_OVERRIDE" | "HELD" | "WITHDRAWN";

export interface AcademicYearRef {
  id: string;
  label: string;
}

export interface RunBatchResponse {
  sourceAcademicYearId: string;
  targetAcademicYearId: string;
  completedAt: string;
  summary: {
    total: number;
    promoted: number;
    failed: number;
  };
  failedStudents: {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    currentClass: string;
    currentSection: string;
    marks?: number;
    attendance?: number;
  }[];
}

export interface ReviewResponse {
  promotionRecordId: string;
  studentName: string;
  outcome: PromotionOutcome;
  newEnrollmentId?: string;
}

export interface PromotionRecordRow {
  id: string;
  promotionRecordId: string;
  promotionBatchId: string;
  studentName: string;
  admissionNumber: string;
  outcome: PromotionOutcome;
  reviewed: boolean;
  reviewedAt: string | null;
  sourceAcademicYear: AcademicYearRef;
  targetAcademicYear: AcademicYearRef;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PromotionBatchRow {
  id: string;
  batchId: string;
  status: string;
  sourceAcademicYear: AcademicYearRef;
  targetAcademicYear: AcademicYearRef;
  totalStudents: number;
  totalPromoted: number;
  completedAt: string | null;
  createdAt: string;
  summary: {
    total: number;
    promoted: number;
    failed: number;
    pendingReview: number;
  };
}

export interface BatchFailedStudent {
  promotionRecordId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  currentClass: string;
  currentSection: string;
  reviewed: boolean;
  reviewedAt: string | null;
  outcome: PromotionOutcome;
}

export interface BatchDetail {
  id: string;
  batchId: string;
  status: string;
  sourceAcademicYear: AcademicYearRef;
  targetAcademicYear: AcademicYearRef;
  totalStudents: number;
  totalPromoted: number;
  createdAt: string;
  completedAt: string | null;
  summary: {
    total: number;
    promoted: number;
    failed: number;
    pendingReview: number;
  };
  failedStudents: BatchFailedStudent[];
}

export interface StudentPromotionHistory {
  id: string;
  promotionRecordId: string;
  promotionBatchId: string;
  outcome: PromotionOutcome;
  reviewed: boolean;
  reviewedAt: string | null;
  reviewReason: string | null;
  sourceAcademicYear: AcademicYearRef;
  targetAcademicYear: AcademicYearRef;
}
