import { apiClient } from "@/shared/lib/apiClient";

export interface StaffRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "RESIGNED";
  joinedAt: string;
}

export interface StaffListResult {
  items: StaffRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaffCreatePayload {
  fullName: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  joinedAt?: string;
  status?: "ACTIVE" | "ON_LEAVE" | "RESIGNED";
}

export const staffApi = {
  async list(): Promise<StaffRecord[]> {
    const { data } = await apiClient.get<{ data: StaffListResult }>("/staff");
    return data.data.items;
  },

  async create(payload: StaffCreatePayload): Promise<StaffRecord> {
    const { data } = await apiClient.post<{ data: StaffRecord }>("/staff", payload);
    return data.data;
  },
};

export default staffApi;