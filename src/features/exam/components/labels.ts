import type { StatusVariant } from "@/shared/components/ui/status-badge";
import type { ExamStatus } from "../api/studentExamApi";
import type { ExamSubjectStatus } from "../api/examApi";

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  DRAFT: "Draft",
  MARKS_ENTRY: "Marks Entry",
  SUBMITTED: "Submitted",
  PUBLISHED: "Published",
  CANCELLED: "Cancelled",
};

export const EXAM_STATUS_VARIANT: Record<ExamStatus, StatusVariant> = {
  DRAFT: "neutral",
  MARKS_ENTRY: "info",
  SUBMITTED: "warning",
  PUBLISHED: "success",
  CANCELLED: "danger",
};

export const SUBJECT_STATUS_LABEL: Record<ExamSubjectStatus, string> = {
  NOT_ENTERED: "Not entered",
  ENTERED: "Entered",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const SUBJECT_STATUS_VARIANT: Record<ExamSubjectStatus, StatusVariant> = {
  NOT_ENTERED: "neutral",
  ENTERED: "info",
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function percentageOf(obtained: number | null | undefined, full: number): number | null {
  if (obtained == null || full <= 0) return null;
  return Math.round((obtained / full) * 1000) / 10;
}
