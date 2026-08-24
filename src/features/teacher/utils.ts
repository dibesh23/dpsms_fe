import type { TeacherApiStatus } from "./api/teacherApi";

export const TEACHER_STATUS_LABELS = ["Active", "On Leave", "Invited", "Inactive"] as const;

export type TeacherStatusLabel = (typeof TEACHER_STATUS_LABELS)[number];

const LABEL_BY_API_STATUS: Record<TeacherApiStatus, TeacherStatusLabel> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  INVITED: "Invited",
  INACTIVE: "Inactive",
};

const API_STATUS_BY_LABEL: Record<TeacherStatusLabel, TeacherApiStatus> = {
  Active: "ACTIVE",
  "On Leave": "ON_LEAVE",
  Invited: "INVITED",
  Inactive: "INACTIVE",
};

export function teacherStatusToLabel(status: string): TeacherStatusLabel {
  if (status in LABEL_BY_API_STATUS) {
    return LABEL_BY_API_STATUS[status as TeacherApiStatus];
  }
  return "Active";
}

export function teacherLabelToStatus(label: TeacherStatusLabel): TeacherApiStatus {
  return API_STATUS_BY_LABEL[label];
}
