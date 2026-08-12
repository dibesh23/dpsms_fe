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

export const parentApi = {
  async list(): Promise<ParentRecord[]> {
    const { data } = await apiClient.get<{ data: ParentListResult }>("/parents");
    return data.data.items;
  },

  async create(payload: ParentCreatePayload): Promise<ParentRecord> {
    const { data } = await apiClient.post<{ data: ParentRecord }>("/parents", payload);
    return data.data;
  },
};

export default parentApi;