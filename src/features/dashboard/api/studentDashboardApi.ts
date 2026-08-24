import { apiClient } from "@/shared/lib/apiClient";


export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type GuardianRelation = "FATHER" | "MOTHER" | "GUARDIAN";
export type StudentLifecycleStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "TRANSFERRED_OUT"
  | "GRADUATED"
  | "WITHDRAWN";
export type ExamStatus = "DRAFT" | "RESULTS_PENDING_APPROVAL" | "PUBLISHED";
export type InvoiceStatus = "DRAFT" | "UNPAID" | "PARTIAL" | "PAID";
export type NotificationType = "ALERT" | "WARNING" | "SUCCESS" | "INFO";
export type SchoolEventCategory =
  | "EXAM"
  | "ACADEMIC"
  | "EXTRA_CURRICULAR"
  | "HOLIDAY"
  | "MEETING"
  | "OTHER";

/** StudentAttendance.status, widened with a client-only sentinel for
 *  "no record exists for this date yet" — the schema has no such
 *  enum value since a row simply doesn't exist until marked. */
export type DayAttendanceStatus = AttendanceStatus | "NOT_MARKED";

export interface GuardianSummary {
  fullName: string;
  relation: GuardianRelation;
  phone: string;
  email: string | null;
  occupation: string | null;
  isPrimary: boolean;
}

export interface StudentProfileSummary {
  fullName: string;
  admissionNumber: string;
  admissionDate: string;
  status: StudentLifecycleStatus;
  dateOfBirth: string | null;
  gender: Gender | null;
  bloodGroup: string | null;
  address: string | null;
  academicYearLabel: string;
  className: string;
  sectionName: string;
  rollNumber: string;
  guardians: GuardianSummary[];
}

export interface DayAttendancePoint {
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  status: DayAttendanceStatus;
}

export interface AttendanceSummary {
  /** % PRESENT out of all marked days, current academic year */
  overallPercent: number;
  /** % PRESENT out of all marked days, current calendar month */
  monthPercent: number;
  monthLabel: string;
  todayStatus: DayAttendanceStatus;
  /** Marked rows in the current academic year — 0 means no attendance data yet */
  totalMarkedDays: number;
  /** Marked rows in the current calendar month — 0 means the month gauge has no denominator */
  totalMarkedDaysThisMonth: number;
  /** Last 30 calendar days ending today, oldest first; NOT_MARKED where no row exists */
  recentDays: DayAttendancePoint[];
  presentDaysThisMonth: number;
  lateDaysThisMonth: number;
  excusedDaysThisMonth: number;
  absentDaysThisMonth: number;
}

export interface ExamSubjectResult {
  subjectId: string;
  subjectName: string;
  theoryMarks: number | null;
  practicalMarks: number | null;
  fullMarksTheory: number;
  fullMarksPractical: number;
  grade: string | null;
}

export interface ExamResultSummary {
  examId: string;
  examName: string;
  examTypeName: string;
  termName: string | null;
  status: ExamStatus;
  totalObtained: number;
  totalFullMarks: number;
  percentage: number;
  overallGrade: string | null;
  subjects: ExamSubjectResult[];
}

export interface FeeDiscountSummary {
  id: string;
  kind: "DISCOUNT" | "SCHOLARSHIP";
  label: string;
  /** Fixed-amount discount (FeeDiscount.amount) */
  amount: number | null;
  /** Scholarship of type PERCENTAGE or FIXED (FeeScholarship.percentageOrAmount) */
  scholarshipType: "PERCENTAGE" | "FIXED" | null;
  percentageOrAmount: number | null;
}

export interface FeeInstallmentSummary {
  invoiceId: string;
  installmentLabel: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
  paidAt: string | null;
  receiptNumber: string | null;
  receiptUrl: string | null;
}

export interface FeeSummary {
  totalAnnualFee: number;
  totalPaid: number;
  totalDue: number;
  discounts: FeeDiscountSummary[];
  installments: FeeInstallmentSummary[];
}

export interface StudentSchoolEvent {
  id: string;
  title: string;
  category: SchoolEventCategory;
  startsAt: string;
  location: string | null;
}

export interface StudentNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface StudentStatCard {
  label: string;
  value: string;
  delta: string;
  deltaDirection: "up" | "down" | "neutral";
  href: string;
}

export interface StudentDashboardSummary {
  stats: StudentStatCard[];
  profile: StudentProfileSummary;
  attendance: AttendanceSummary;
  examResults: ExamResultSummary[];
  fee: FeeSummary;
  upcomingEvents: StudentSchoolEvent[];
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