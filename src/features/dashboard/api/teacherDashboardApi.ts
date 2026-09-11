import { apiClient } from "@/shared/lib/apiClient";

export type TeacherStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "INVITED";
export type StaffAttendanceStatus = "PRESENT" | "ABSENT" | "ON_LEAVE";
export type NotificationType = "ALERT" | "WARNING" | "SUCCESS" | "INFO";
export type SchoolEventCategory =
  "EXAM" | "ACADEMIC" | "EXTRA_CURRICULAR" | "HOLIDAY" | "MEETING" | "OTHER";

export interface TeacherStatCard {
  label: string;
  value: string;
  delta: string;
  deltaDirection: "up" | "down" | "neutral";
  href: string;
}

export interface SubjectAssignmentSummary {
  id: string;
  name: string;
}

export interface ClassTeacherSection {
  sectionId: string;
  sectionName: string;
  className: string;
}

export interface TeacherProfileSummary {
  fullName: string;
  email: string | null;
  phone: string | null;
  status: TeacherStatus;
  departmentName: string | null;
  employeeCode: string | null;
  joinedAt: string | null;
  classesPerWeek: number;
  subjects: SubjectAssignmentSummary[];
  classTeacherOf: ClassTeacherSection[];
}

export interface SectionAttendanceSnapshot {
  sectionId: string;
  classId: string;
  className: string;
  sectionName: string;
  totalStudents: number;
  totalMarked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface WeeklyTrendDatum {
  label: string;
  value: number;
  valueLabel: string;
}

export interface OwnAttendanceRecord {
  date: string;
  status: StaffAttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface OwnAttendanceSummary {
  monthLabel: string;
  presentDays: number;
  absentDays: number;
  onLeaveDays: number;
  recentRecords: OwnAttendanceRecord[];
}

export interface TeacherSchoolEvent {
  id: string;
  title: string;
  category: SchoolEventCategory;
  startsAt: string;
  location: string | null;
}

export interface TeacherNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TeacherDashboardSummary {
  academicYearLabel: string;
  stats: TeacherStatCard[];
  profile: TeacherProfileSummary;
  sectionsToday: SectionAttendanceSnapshot[];
  sectionsMonth: SectionAttendanceSnapshot[];
  weeklyAttendanceTrend: WeeklyTrendDatum[];
  ownAttendance: OwnAttendanceSummary;
  upcomingEvents: TeacherSchoolEvent[];
  notifications: TeacherNotification[];
}

export const teacherDashboardApi = {
  async getSummary(): Promise<TeacherDashboardSummary> {
    const { data } = await apiClient.get<{ data: TeacherDashboardSummary }>(
      "/dashboard/teacher-summary",
    );
    if (!data?.data) {
      throw new Error("Invalid response from teacher dashboard endpoint");
    }
    return data.data;
  },
};

export default teacherDashboardApi;
