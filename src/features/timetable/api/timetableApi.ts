import { apiClient } from "@/shared/lib/apiClient";

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface TimetableRecord {
  id: string;
  name: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearLabel: string;
  slotCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableSlotRecord {
  id: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string | null;
  subjectName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  isBreak: boolean;
}

export interface TimetableDetailRecord extends TimetableRecord {
  slots: TimetableSlotRecord[];
}

export interface TeacherTimetableRecord {
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  className: string;
  subjectName: string;
  timetableName: string;
  isBreak: boolean;
}

export interface StudentTimetableRecord {
  timetableId: string;
  timetableName: string;
  className: string;
  academicYearLabel: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string | null;
  subjectName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  isBreak: boolean;
}

export type TimetableCellSource = {
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string | null;
  teacherName?: string | null;
  className?: string;
  timetableName?: string;
  isBreak: boolean;
};

interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const timetableApi = {
  async listTimetables(query?: { classId?: string; academicYearId?: string }): Promise<ListResult<TimetableRecord>> {
    const { data } = await apiClient.get<{ data: ListResult<TimetableRecord> }>("/timetables", {
      params: query,
    });
    return data.data;
  },

  async getTimetable(id: string): Promise<TimetableDetailRecord> {
    const { data } = await apiClient.get<{ data: TimetableDetailRecord }>(`/timetables/${id}`);
    return data.data;
  },

  async createTimetable(payload: {
    classId: string;
    academicYearId: string;
    name: string;
  }): Promise<TimetableRecord> {
    const { data } = await apiClient.post<{ data: TimetableRecord }>("/timetables", payload);
    return data.data;
  },

  async updateTimetable(id: string, payload: { name?: string }): Promise<void> {
    await apiClient.patch(`/timetables/${id}`, payload);
  },

  async deleteTimetable(id: string): Promise<void> {
    await apiClient.delete(`/timetables/${id}`);
  },

  async createSlot(
    timetableId: string,
    payload: {
      dayOfWeek: DayOfWeek;
      periodNumber: number;
      startTime: string;
      endTime: string;
      subjectId?: string | null;
      teacherId?: string | null;
      isBreak?: boolean;
    },
  ): Promise<TimetableSlotRecord> {
    const { data } = await apiClient.post<{ data: TimetableSlotRecord }>(
      `/timetables/${timetableId}/slots`,
      payload,
    );
    return data.data;
  },

  async updateSlot(
    timetableId: string,
    slotId: string,
    payload: {
      dayOfWeek?: DayOfWeek;
      periodNumber?: number;
      startTime?: string;
      endTime?: string;
      subjectId?: string | null;
      teacherId?: string | null;
      isBreak?: boolean;
    },
  ): Promise<TimetableSlotRecord> {
    const { data } = await apiClient.patch<{ data: TimetableSlotRecord }>(
      `/timetables/${timetableId}/slots/${slotId}`,
      payload,
    );
    return data.data;
  },

  async deleteSlot(timetableId: string, slotId: string): Promise<void> {
    await apiClient.delete(`/timetables/${timetableId}/slots/${slotId}`);
  },

  async getMyTeacherTimetable(): Promise<TeacherTimetableRecord[]> {
    const { data } = await apiClient.get<{ data: TeacherTimetableRecord[] }>(
      "/teachers/me/timetables",
    );
    return data.data;
  },

  async getMyStudentTimetable(): Promise<StudentTimetableRecord[]> {
    const { data } = await apiClient.get<{ data: StudentTimetableRecord[] }>(
      "/students/me/timetables",
    );
    return data.data;
  },
};

export default timetableApi;
