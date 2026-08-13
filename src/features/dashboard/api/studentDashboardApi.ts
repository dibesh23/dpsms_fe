import { apiClient } from "@/shared/lib/apiClient";

export interface StudentStatCard {
  label: string;
  value: string;
  delta: string;
  deltaDirection: "up" | "down" | "neutral";
  href: string;
}

export interface StudentProfileSummary {
  fullName: string;
  admissionNumber: string;
  admissionDate: string;
  grade: string;
  section: string;
  guardianName: string | null;
  feeDiscountPercent: number;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  medicalNotes: string | null;
  identificationMark: string | null;
  birthCertificateOrNic: string | null;
}

export type MarkStatus = "PRESENT" | "ABSENT" | "LEAVE" | "NOT_MARKED";

export interface AttendanceSummary {
  overallPercent: number;
  monthPercent: number;
  monthLabel: string;
  todayStatus: MarkStatus;
  yesterdayStatus: MarkStatus;
  presentsThisMonth: number;
  leavesThisMonth: number;
  absentsThisMonth: number;
}

export interface ClassTestResult {
  id: string;
  subject: string;
  testName: string;
  date: string;
  marksObtained: number;
  marksTotal: number;
}

export interface ExamResult {
  id: string;
  examName: string;
  term: string;
  date: string;
  percentage: number;
  grade: string;
  status: "Pass" | "Fail" | "Pending";
}

export interface FeeInstallment {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
}

export interface FeeSummary {
  totalAnnualFee: number;
  totalPaid: number;
  totalDue: number;
  discountPercent: number;
  nextDueDate: string | null;
  installments: FeeInstallment[];
}

export interface StudentUpcomingEvent {
  id: string;
  day: string;
  month: string;
  title: string;
  meta: string;
}

export interface StudentNotification {
  id: string;
  tone: string;
  bg: string;
  title: string;
  time: string;
  unread: boolean;
}

export interface StudentDashboardSummary {
  academicYear: string;
  stats: StudentStatCard[];
  profile: StudentProfileSummary;
  attendance: AttendanceSummary;
  classTests: ClassTestResult[];
  examResults: ExamResult[];
  fee: FeeSummary;
  upcomingEvents: StudentUpcomingEvent[];
  notifications: StudentNotification[];
}

export const studentDashboardApi = {
  async getSummary(): Promise<StudentDashboardSummary> {
    const { data } = await apiClient.get<{ data: StudentDashboardSummary }>(
      "/dashboard/student-summary",
    );
    return data.data;
  },
};

export default studentDashboardApi;