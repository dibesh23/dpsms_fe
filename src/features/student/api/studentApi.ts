import { apiClient } from "@/shared/lib/apiClient";

export interface StudentRecord {
  id: string;
  admissionNumber: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  bloodGroup: string | null;
  address: string | null;
  grade: string;
  section: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  enrolledAt: string;
}

export interface StudentListResult {
  items: StudentRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StudentCreatePayload {
  fullName: string;
  email?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  admissionDate?: string;
  grade: string;
  section?: string;
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
}

export interface StudentCreateResult extends StudentRecord {
  credentials?: {
    email: string;
    password: string;
  };
}

export const studentApi = {
  async list(): Promise<StudentRecord[]> {
    const { data } = await apiClient.get<{ data: StudentListResult }>("/students");
    return data.data.items;
  },

  async create(payload: StudentCreatePayload): Promise<StudentCreateResult> {
    const { data } = await apiClient.post<{ data: StudentCreateResult }>("/students", payload);
    return data.data;
  },
};

export default studentApi;