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
  email: string;
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

export type GuardianRelation = "FATHER" | "MOTHER" | "GUARDIAN";

export interface GuardianRecord {
  id: string;
  fullName: string;
  relation: GuardianRelation | string;
  phone: string;
  email: string | null;
  occupation: string | null;
  isPrimary: boolean;
}

export interface GuardianPayload {
  fullName: string;
  relation: GuardianRelation;
  phone: string;
  email?: string;
  occupation?: string;
  isPrimary?: boolean;
}

export interface StudentDocumentRecord {
  id: string;
  documentType: string;
  attachmentId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface TransferResult {
  enrollmentId: string;
  fromClassName: string;
  fromSectionName: string;
  toClassName: string;
  toSectionName: string;
}

export interface StudentEnrollmentDetail {
  id: string;
  rollNumber: string;
  status: string;
  academicYear: {
    id: string;
    label: string;
  } | null;
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  } | null;
}

// Raw row returned by GET /students/:id and PATCH /students/:id.
export interface StudentDetailRecord {
  id: string;
  admissionNumber: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  address: string | null;
  admissionDate: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  createdAt: string;
  updatedAt: string;
  enrollments: StudentEnrollmentDetail[];
}

export interface StudentUpdatePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  admissionDate?: string;
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
}

export interface StudentTransferPayload {
  classId: string;
  sectionId: string;
  effectiveDate: string;
  reason?: string;
}

export interface MyStudentItem {
  studentId: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
}

export const studentApi = {
  async list(): Promise<StudentRecord[]> {
    const { data } = await apiClient.get<{ data: StudentListResult }>("/students");
    return data.data.items;
  },

  async get(id: string): Promise<StudentDetailRecord> {
    const { data } = await apiClient.get<{ data: StudentDetailRecord }>(`/students/${id}`);
    return data.data;
  },

  async create(payload: StudentCreatePayload): Promise<StudentCreateResult> {
    const { data } = await apiClient.post<{ data: StudentCreateResult }>("/students", payload);
    return data.data;
  },

  async update(id: string, payload: StudentUpdatePayload): Promise<StudentDetailRecord> {
    const { data } = await apiClient.patch<{ data: StudentDetailRecord }>(
      `/students/${id}`,
      payload,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/students/${id}`);
  },

  async myStudents(sectionId?: string): Promise<MyStudentItem[]> {
    const { data } = await apiClient.get<{ data: { items: MyStudentItem[] } }>("/students/my", {
      params: sectionId ? { sectionId } : undefined,
    });
    return data.data.items;
  },

  async transfer(id: string, payload: StudentTransferPayload): Promise<TransferResult> {
    const { data } = await apiClient.post<{ data: TransferResult }>(
      `/students/${id}/transfer`,
      payload,
    );
    return data.data;
  },

  // ---------- Guardians ----------
  async listGuardians(id: string): Promise<GuardianRecord[]> {
    const { data } = await apiClient.get<{ data: GuardianRecord[] }>(`/students/${id}/guardians`);
    return data.data;
  },

  async createGuardian(id: string, payload: GuardianPayload): Promise<GuardianRecord> {
    const { data } = await apiClient.post<{ data: GuardianRecord }>(
      `/students/${id}/guardians`,
      payload,
    );
    return data.data;
  },

  async updateGuardian(guardianId: string, payload: Partial<GuardianPayload>): Promise<void> {
    await apiClient.patch(`/guardians/${guardianId}`, payload);
  },

  async removeGuardian(studentId: string, guardianId: string): Promise<void> {
    await apiClient.delete(`/students/${studentId}/guardians/${guardianId}`);
  },

  // ---------- Documents ----------
  async listDocuments(id: string): Promise<StudentDocumentRecord[]> {
    const { data } = await apiClient.get<{ data: StudentDocumentRecord[] }>(
      `/students/${id}/documents`,
    );
    return data.data;
  },

  async uploadDocument(
    id: string,
    file: File,
    documentType: string,
  ): Promise<StudentDocumentRecord> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    const { data } = await apiClient.postForm<{ data: StudentDocumentRecord }>(
      `/students/${id}/documents`,
      formData,
    );
    return data.data;
  },

  async deleteDocument(id: string, documentId: string): Promise<void> {
    await apiClient.delete(`/students/${id}/documents/${documentId}`);
  },
};

export default studentApi;
