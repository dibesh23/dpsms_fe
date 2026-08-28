import { apiClient } from "@/shared/lib/apiClient";

export interface AdmissionLetterData {
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  admissionDate: string;
  dateOfBirth: string | null;
  gender: string | null;
  academicYear: string;
  className: string;
  sectionName: string;
  status: string;
}

export const admissionLetterApi = {
  async get(): Promise<AdmissionLetterData | null> {
    try {
      const { data } = await apiClient.get<{ data: AdmissionLetterData }>("/students/me/admission-letter");
      return data.data;
    } catch {
      return null;
    }
  },
};

export default admissionLetterApi;
