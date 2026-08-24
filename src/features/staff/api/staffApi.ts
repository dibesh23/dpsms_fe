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

export type StaffUpdatePayload = Partial<StaffCreatePayload>;

// GET /staff/:id returns the raw staff row (fullName + department object),
// unlike list/create/update which return the normalized StaffRecord.
export interface StaffDetailRecord {
  id: string;
  tenantId: string;
  departmentId: string | null;
  fullName: string;
  role: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "RESIGNED";
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  department: { id: string; name: string } | null;
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

  async get(id: string): Promise<StaffDetailRecord> {
    const { data } = await apiClient.get<{ data: StaffDetailRecord }>(`/staff/${id}`);
    return data.data;
  },

  async update(id: string, payload: StaffUpdatePayload): Promise<StaffDetailRecord> {
    const { data } = await apiClient.patch<{ data: StaffDetailRecord }>(`/staff/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/staff/${id}`);
  },
};

export default staffApi;