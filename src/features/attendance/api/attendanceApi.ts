import { apiClient } from "@/shared/lib/apiClient";

export type StudentAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type StaffAttendanceStatus = "PRESENT" | "ABSENT" | "ON_LEAVE";

export interface SectionOption {
  id: string;
  name: string;
  className: string;
  label: string;
}

export interface MySection {
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  academicYearId: string;
}

export interface MySectionsResponse {
  items: MySection[];
  academicYearId: string;
}

export interface RosterEntry {
  enrollmentId: string;
  rollNumber: string;
  studentId: string;
  studentName: string;
  status: StudentAttendanceStatus | null;
}

export interface RosterResponse {
  items: RosterEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaffRosterEntry {
  teacherId: string;
  teacherName: string;
  status: StaffAttendanceStatus | null;
}

export interface StaffRosterResponse {
  items: StaffRosterEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SectionAttendanceRecord {
  id: string;
  enrollmentId: string;
  studentName: string;
  rollNumber: string;
  sectionId: string;
  date: string;
  status: StudentAttendanceStatus;
  markedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  status: StaffAttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface StudentAttendanceResponse {
  items: SectionAttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaffAttendanceResponse {
  items: StaffAttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StudentAttendanceStats {
  sections: Array<{
    sectionId: string;
    sectionName: string;
    totalStudents: number;
    totalMarked: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  }>;
  summary: {
    totalStudents: number;
    totalMarked: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  };
  dateRange: { from: string; to: string };
}

export interface StaffAttendanceStats {
  totalTeachers: number;
  teachersWithAttendance: number;
  totalMarked: number;
  present: number;
  absent: number;
  onLeave: number;
  attendanceRate: number;
  dateRange: { from: string; to: string };
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const attendanceApi = {
  async listSections(): Promise<SectionOption[]> {
    const { data } = await apiClient.get<{ data: SectionOption[] }>("/sections");
    return data.data;
  },

  async getMySections(): Promise<MySectionsResponse> {
    const { data } = await apiClient.get<{ data: MySectionsResponse }>("/attendance/my-sections");
    return data.data;
  },

  async getSectionRoster(
    sectionId: string,
    date: Date,
    page = 1,
    pageSize = 100,
  ): Promise<RosterResponse> {
    const { data } = await apiClient.get<{ data: RosterResponse }>("/attendance/roster", {
      params: { sectionId, date: toDateString(date), page, pageSize },
    });
    return data.data;
  },

  async getStaffRoster(date: Date, page = 1, pageSize = 100): Promise<StaffRosterResponse> {
    const { data } = await apiClient.get<{ data: StaffRosterResponse }>(
      "/attendance/staff-roster",
      {
        params: { date: toDateString(date), page, pageSize },
      },
    );
    return data.data;
  },

  async getSectionAttendance(
    sectionId: string,
    date: Date,
    page = 1,
    pageSize = 50,
  ): Promise<StudentAttendanceResponse> {
    const { data } = await apiClient.get<{ data: StudentAttendanceResponse }>(
      "/attendance/student/section",
      { params: { sectionId, date: toDateString(date), page, pageSize } },
    );
    return data.data;
  },

  async getStudentStats(from: Date, to: Date, sectionId?: string): Promise<StudentAttendanceStats> {
    const params: Record<string, string> = { from: toDateString(from), to: toDateString(to) };
    if (sectionId) params.sectionId = sectionId;
    const { data } = await apiClient.get<{ data: StudentAttendanceStats }>(
      "/attendance/student/stats",
      { params },
    );
    return data.data;
  },

  async markStudentAttendance(payload: {
    enrollmentId: string;
    sectionId: string;
    date: Date;
    status: StudentAttendanceStatus;
  }): Promise<SectionAttendanceRecord> {
    const { data } = await apiClient.post<{ data: SectionAttendanceRecord }>(
      "/attendance/student/mark",
      { ...payload, date: toDateString(payload.date) },
    );
    return data.data;
  },

  async bulkMarkStudentAttendance(payload: {
    sectionId: string;
    date: Date;
    entries: Array<{ enrollmentId: string; status: StudentAttendanceStatus }>;
  }): Promise<SectionAttendanceRecord[]> {
    const { data } = await apiClient.post<{ data: SectionAttendanceRecord[] }>(
      "/attendance/student/bulk-mark",
      { ...payload, date: toDateString(payload.date) },
    );
    return data.data;
  },

  async getStaffAttendanceByDate(
    date: Date,
    page = 1,
    pageSize = 50,
  ): Promise<StaffAttendanceResponse> {
    const { data } = await apiClient.get<{ data: StaffAttendanceResponse }>(
      "/attendance/staff/by-date",
      { params: { date: toDateString(date), page, pageSize } },
    );
    return data.data;
  },

  async getStaffStats(from: Date, to: Date): Promise<StaffAttendanceStats> {
    const { data } = await apiClient.get<{ data: StaffAttendanceStats }>(
      "/attendance/staff/stats",
      { params: { from: toDateString(from), to: toDateString(to) } },
    );
    return data.data;
  },

  async markStaffAttendance(payload: {
    teacherId: string;
    date: Date;
    status: StaffAttendanceStatus;
  }): Promise<StaffAttendanceRecord> {
    const { data } = await apiClient.post<{ data: StaffAttendanceRecord }>(
      "/attendance/staff/mark",
      { ...payload, date: toDateString(payload.date) },
    );
    return data.data;
  },

  async bulkMarkStaffAttendance(payload: {
    date: Date;
    entries: Array<{ teacherId: string; status: StaffAttendanceStatus }>;
  }): Promise<StaffAttendanceRecord[]> {
    const { data } = await apiClient.post<{ data: StaffAttendanceRecord[] }>(
      "/attendance/staff/bulk-mark",
      { ...payload, date: toDateString(payload.date) },
    );
    return data.data;
  },
};

export default attendanceApi;
