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
};

export default timetableApi;
