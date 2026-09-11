import { apiClient } from "@/shared/lib/apiClient";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface MyAttendanceRecord {
  id: string;
  enrollmentId: string;
  sectionId: string;
  date: string;
  status: AttendanceStatus;
}

export interface MyAttendanceSummary {
  totalMarked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface MyAttendanceResponse {
  enrollmentId: string;
  sectionId: string;
  records: MyAttendanceRecord[];
  summary: MyAttendanceSummary;
  dateRange: { from: string; to: string };
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const studentAttendanceApi = {
  async getMyAttendance(from: Date, to: Date): Promise<MyAttendanceResponse> {
    const { data } = await apiClient.get<{ data: MyAttendanceResponse }>("/attendance/me", {
      params: { from: toDateString(from), to: toDateString(to) },
    });
    return data.data;
  },
};

export default studentAttendanceApi;
