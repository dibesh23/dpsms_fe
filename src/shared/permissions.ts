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
  TEACHER_ASSIGNMENT_MANAGE: "teachers:assignments:manage",

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
  ACADEMIC_DEPARTMENT_UPDATE: "academic:departments:update",
  ACADEMIC_SUBJECT_LIST: "academic:subjects:list",
  ACADEMIC_SUBJECT_CREATE: "academic:subjects:create",
  ACADEMIC_SESSION_LIST: "academic:sessions:list",
  ACADEMIC_SESSION_CREATE: "academic:sessions:create",
  ACADEMIC_SESSION_UPDATE: "academic:sessions:update",
  ACADEMIC_SECTION_UPDATE: "academic:sections:update",

  TEACHER_OWN_CLASSES_VIEW: "teachers:own-classes:view",
  ATTENDANCE_OWN_VIEW: "attendance:own:view",
  EXAM_OWN_VIEW: "exam:own:view",
  FEE_OWN_VIEW: "fees:own:view",
  NOTICE_OWN_VIEW: "notices:own:view",
  TIMETABLE_OWN_VIEW: "timetable:own:view",
  ASSIGNMENT_OWN_VIEW: "assignments:own:view",
  LIVE_CLASS_OWN_VIEW: "live-class:own:view",
  ADMISSION_LETTER_VIEW: "admission-letter:own:view",
  MESSAGING_OWN_VIEW: "messaging:own:view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Administrator",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
};
