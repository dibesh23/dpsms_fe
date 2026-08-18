export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  STUDENT_LIST: "students:list",
  STUDENT_CREATE: "students:create",
  STUDENT_UPDATE: "students:update",
  STUDENT_DELETE: "students:delete",

  TEACHER_LIST: "teachers:list",
  TEACHER_CREATE: "teachers:create",
  TEACHER_UPDATE: "teachers:update",
  TEACHER_DELETE: "teachers:delete",

  PARENT_LIST: "parents:list",
  PARENT_CREATE: "parents:create",
  PARENT_UPDATE: "parents:update",
  PARENT_DELETE: "parents:delete",

  STAFF_LIST: "staff:list",
  STAFF_CREATE: "staff:create",
  STAFF_UPDATE: "staff:update",
  STAFF_DELETE: "staff:delete",

  ACADEMIC_CLASS_LIST: "academic:classes:list",
  ACADEMIC_CLASS_CREATE: "academic:classes:create",
  ACADEMIC_DEPARTMENT_LIST: "academic:departments:list",
  ACADEMIC_DEPARTMENT_CREATE: "academic:departments:create",
  ACADEMIC_SUBJECT_LIST: "academic:subjects:list",
  ACADEMIC_SUBJECT_CREATE: "academic:subjects:create",
  ACADEMIC_SESSION_LIST: "academic:sessions:list",
  ACADEMIC_SESSION_CREATE: "academic:sessions:create",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Administrator",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
};
