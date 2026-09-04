import { apiClient } from "@/shared/lib/apiClient";
import type { ReportCardData } from "./studentExamApi";

export const reportCardApi = {
  async getOwn(): Promise<ReportCardData> {
    const { data } = await apiClient.get<{ data: ReportCardData }>("/students/me/exam-results");
    return data.data;
  },
  async getForStudent(studentId: string): Promise<ReportCardData> {
    const { data } = await apiClient.get<{ data: ReportCardData }>(
      `/students/${studentId}/report-card`,
    );
    return data.data;
  },
};

export default reportCardApi;
