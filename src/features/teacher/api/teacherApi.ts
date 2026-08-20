import { apiClient } from "@/shared/lib/apiClient";

export interface TeacherRecord {
  id: string;
  name: string;
  subject: string;
  department: string;
  email: string;
  phone: string | null;
  classesPerWeek: number;
  status: "ACTIVE" | "ON_LEAVE" | "INVITED" | "INACTIVE";
  joinedAt: string;
}

export interface TeacherListResult {
  items: TeacherRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TeacherCreatePayload {
  fullName: string;
  email: string;
  subject?: string;
  department?: string;
  phone?: string;
  classesPerWeek?: number;
  status?: "ACTIVE" | "ON_LEAVE" | "INVITED" | "INACTIVE";
}

export interface TeacherCreateResult extends TeacherRecord {
  credentials?: {
    email: string;
    password: string;
  };
}

export const teacherApi = {
  async list(): Promise<TeacherRecord[]> {
    const { data } = await apiClient.get<{ data: TeacherListResult }>("/teachers");
    return data.data.items;
  },

  async create(payload: TeacherCreatePayload): Promise<TeacherCreateResult> {
    const { data } = await apiClient.post<{ data: TeacherCreateResult }>("/teachers", payload);
    return data.data;
  },
};

export default teacherApi;