import { apiClient } from "@/shared/lib/apiClient";

export interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaDirection: "up" | "down" | "neutral";
  href: string;
}

export interface BarDatum {
  label: string;
  value: number;
  valueLabel: string;
}

export interface GradeDatum {
  label: string;
  value: number;
  color: string;
}

export interface ActivityItem {
  type: string;
  tone: string;
  title: string;
  time: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  day: string;
  month: string;
  title: string;
  meta: string;
  startsAt: string;
  category: string;
}

export interface AdmissionItem {
  id: string;
  name: string;
  grade: string;
  date: string;
  admissionDate: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  tone: string;
  bg: string;
  title: string;
  time: string;
  createdAt: string;
  unread: boolean;
}

export interface DashboardSummary {
  academicYear: string;
  stats: StatCard[];
  attendanceToday: number;
  weeklyAttendance: BarDatum[];
  gradeDistribution: GradeDatum[];
  gradeDistributionTotal: number;
  recentActivities: ActivityItem[];
  upcomingEvents: EventItem[];
  recentAdmissions: AdmissionItem[];
  notifications: NotificationItem[];
}

// Teacher-scoped dashboard payload — everything is limited to the
// teacher's own assigned sections (server-enforced).
export interface TeacherSectionSummary {
  sectionId: string;
  className: string;
  sectionName: string;
  studentCount: number;
}

export interface TeacherTodayAttendance {
  marked: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
}

export interface TeacherSummary {
  teacherName: string;
  academicYearLabel: string | null;
  totalSections: number;
  totalStudents: number;
  presentTodayPct: number | null;
  today: TeacherTodayAttendance;
  sections: TeacherSectionSummary[];
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<{ data: DashboardSummary }>("/dashboard/summary");
    return data.data;
  },

  async getTeacherSummary(): Promise<TeacherSummary> {
    const { data } = await apiClient.get<{ data: TeacherSummary }>(
      "/dashboard/teacher-summary",
    );
    return data.data;
  },
};

export default dashboardApi;