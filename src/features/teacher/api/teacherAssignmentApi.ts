import { apiClient } from "@/shared/lib/apiClient";

export interface SubjectAssignmentRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
}

export interface ClassAssignmentRecord {
  id: string;
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearLabel: string;
}

export const teacherAssignmentApi = {
  async listSubjectAssignments(teacherId: string): Promise<SubjectAssignmentRecord[]> {
    const { data } = await apiClient.get<{ data: SubjectAssignmentRecord[] }>(
      `/teachers/${teacherId}/assignments`,
    );
    return data.data;
  },

  async createSubjectAssignment(
    teacherId: string,
    payload: { subjectId: string; sectionId: string },
  ): Promise<SubjectAssignmentRecord> {
    const { data } = await apiClient.post<{ data: SubjectAssignmentRecord }>(
      `/teachers/${teacherId}/subject-assignments`,
      payload,
    );
    return data.data;
  },

  async removeSubjectAssignment(teacherId: string, assignmentId: string): Promise<void> {
    await apiClient.delete(`/teachers/${teacherId}/subject-assignments/${assignmentId}`);
  },

  async listClassAssignments(teacherId: string): Promise<ClassAssignmentRecord[]> {
    const { data } = await apiClient.get<{ data: ClassAssignmentRecord[] }>(
      `/teachers/${teacherId}/class-assignments`,
    );
    return data.data;
  },

  async createClassAssignment(
    teacherId: string,
    payload: { sectionId: string; academicYearId?: string },
  ): Promise<ClassAssignmentRecord> {
    const { data } = await apiClient.post<{ data: ClassAssignmentRecord }>(
      `/teachers/${teacherId}/class-assignments`,
      payload,
    );
    return data.data;
  },

  async removeClassAssignment(teacherId: string, assignmentId: string): Promise<void> {
    await apiClient.delete(`/teachers/${teacherId}/class-assignments/${assignmentId}`);
  },
};

export default teacherAssignmentApi;
