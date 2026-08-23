import { apiClient } from "@/shared/lib/apiClient";

export interface ParentRecord {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  status: "VERIFIED" | "PENDING";
  students: string[];
}

export interface ParentListResult {
  items: ParentRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ParentCreatePayload {
  fullName: string;
  relation?: "FATHER" | "MOTHER" | "GUARDIAN";
  phone: string;
  email?: string;
  occupation?: string;
  status?: "VERIFIED" | "PENDING";
  studentNames?: string[];
}

export type ParentUpdatePayload = Partial<ParentCreatePayload>;

export const parentApi = {
  async list(): Promise<ParentRecord[]> {
    const { data } = await apiClient.get<{ data: ParentListResult }>("/parents");
    return data.data.items;
  },

  async create(payload: ParentCreatePayload): Promise<ParentRecord> {
    const { data } = await apiClient.post<{ data: ParentRecord }>("/parents", payload);
    return data.data;
  },

  async get(id: string): Promise<ParentRecord> {
    const { data } = await apiClient.get<{ data: ParentRecord }>(`/parents/${id}`);
    return data.data;
  },

  async update(id: string, payload: ParentUpdatePayload): Promise<ParentRecord> {
    const { data } = await apiClient.patch<{ data: ParentRecord }>(`/parents/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/parents/${id}`);
  },
};

export default parentApi;