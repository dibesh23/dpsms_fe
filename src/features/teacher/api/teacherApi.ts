import { apiClient } from "@/shared/lib/apiClient";

export interface TeacherRecord {
  id: string;
  name: string;
  subject: string;
  subjects: string[];
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

export type TeacherApiStatus = "ACTIVE" | "ON_LEAVE" | "INVITED" | "INACTIVE";

export interface TeacherDetailSubjectAssignment {
  id: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  academicYear: {
    id: string;
    label: string;
  };
}

export interface TeacherDetailRecord {
  id: string;
  fullName: string;
  phone: string | null;
  classesPerWeek: number;
  status: TeacherApiStatus;
  user: {
    email: string;
    fullName: string;
  };
  department: {
    id: string;
    name: string;
  } | null;
  teacherSchoolMemberships: Array<{
    id: string;
    employeeCode: string | null;
    joinedAt: string;
  }>;
  teacherSubjectAssignments: TeacherDetailSubjectAssignment[];
}

export interface TeacherUpdatePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  classesPerWeek?: number;
  status?: TeacherApiStatus;
}

export interface MyClassItem {
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  academicYearLabel: string;
  subjects: Array<{ id: string; name: string }>;
  totalStudents: number;
  isClassTeacher: boolean;
}

export const teacherApi = {
  async list(): Promise<TeacherRecord[]> {
    const { data } = await apiClient.get<{ data: TeacherListResult }>("/teachers");
    return data.data.items;
  },

  async get(id: string): Promise<TeacherDetailRecord> {
    const { data } = await apiClient.get<{ data: TeacherDetailRecord }>(`/teachers/${id}`);
    return data.data;
  },

  async create(payload: TeacherCreatePayload): Promise<TeacherCreateResult> {
    const { data } = await apiClient.post<{ data: TeacherCreateResult }>("/teachers", payload);
    return data.data;
  },

  async update(id: string, payload: TeacherUpdatePayload): Promise<TeacherDetailRecord> {
    const { data } = await apiClient.patch<{ data: TeacherDetailRecord }>(
      `/teachers/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/teachers/${id}`);
  },

  async myClasses(): Promise<MyClassItem[]> {
    const { data } = await apiClient.get<{ data: { items: MyClassItem[] } }>(
      "/teachers/me/classes",
    );
    return data.data.items;
  },
};

export default teacherApi;
