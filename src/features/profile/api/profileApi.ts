import { apiClient } from "@/shared/lib/apiClient";

export interface SchoolInfo {
  id: string;
  name: string;
  subdomain: string;
}

export interface TeacherProfile {
  id: string;
  fullName: string;
  phone: string | null;
  status: string;
  department: string;
}

export interface StudentProfile {
  id: string;
  admissionNumber: string;
  fullName: string;
  phone: string | null;
  status: string;
}

export interface ProfileRecord {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  status: string;
  authProvider: string;
  tenantId: string;
  school: SchoolInfo;
  teacher: TeacherProfile | null;
  student: StudentProfile | null;
  createdAt: string;
  updatedAt: string;
}

export const profileApi = {
  async getProfile(): Promise<ProfileRecord> {
    const { data } = await apiClient.get<{ data: ProfileRecord }>("/profile");
    return data.data;
  },
  async updateProfile(payload: {
    fullName?: string;
    phone?: string;
  }): Promise<ProfileRecord> {
    const { data } = await apiClient.patch<{ data: ProfileRecord }>(
      "/profile",
      payload,
    );
    return data.data;
  },
  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiClient.post("/profile/password", payload);
  },
};

export default profileApi;