import type { StatusVariant } from "@/shared/components/ui/status-badge";
import type { AssignmentStatus, SubmissionStatus } from "../api/assignmentApi";

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

export const ASSIGNMENT_STATUS_VARIANT: Record<AssignmentStatus, StatusVariant> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CLOSED: "warning",
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  NOT_STARTED: "Not started",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
};

export const SUBMISSION_STATUS_VARIANT: Record<SubmissionStatus, StatusVariant> = {
  NOT_STARTED: "neutral",
  SUBMITTED: "info",
  GRADED: "success",
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
