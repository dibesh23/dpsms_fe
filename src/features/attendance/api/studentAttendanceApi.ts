import { apiClient } from "@/shared/lib/apiClient";

// Mirrors schema.prisma: StudentAttendance.status
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
  id: string;
  date: string; // StudentAttendance.date
  status: AttendanceStatus; // StudentAttendance.status
  sectionName: string; // StudentAttendance.section -> Section.name
  className: string; // Section.class -> Class.name
}

export interface AttendanceHistorySummary {
  academicYearLabel: string;
  totalMarkedDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  overallPercent: number;
  records: AttendanceRecord[];
}

export const studentAttendanceApi = {
  async getHistory(): Promise<AttendanceHistorySummary> {
    const { data } = await apiClient.get<{ data: AttendanceHistorySummary }>(
      "/students/me/attendance",
    );
    return data.data;
  },
};

export default studentAttendanceApi;