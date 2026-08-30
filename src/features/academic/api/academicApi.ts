import { apiClient } from "@/shared/lib/apiClient";

export interface ClassRecord {
  id: string;
  name: string;
  sections: string[];
  students: number;
  sortOrder: number;
  academicYearId: string;
  academicYearLabel: string;
  createdAt: string;
}

export interface DepartmentHeadRecord {
  id: string;
  fullName: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  headTeacher: DepartmentHeadRecord | null;
  headStaff: DepartmentHeadRecord | null;
  description: string;
  staffCount: number;
  teacherCount: number;
  subjectCount: number;
  createdAt: string;
}

export interface SubjectRecord {
  id: string;
  name: string;
  code: string;
  type: string;
  department: string;
}

export interface SessionRecord {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SectionRecord {
  id: string;
  name: string;
  classId: string;
  className: string;
  capacity: number | null;
  shiftId: string | null;
  houseId: string | null;
  classTeacherId: string | null;
  createdAt: string;
}

export interface ClassSubjectRecord {
  classId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  isElectiveGroup: boolean;
}

export interface ClassStudentRow {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  fullName: string;
  status: string;
  sectionId: string;
  sectionName: string;
  rollNumber: string;
  enrolledAt: string;
}

interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const getItems = async <T>(path: string): Promise<T[]> => {
  const { data } = await apiClient.get<{ data: ListResult<T> }>(path);
  return data.data.items;
};

export const academicApi = {
  // ---------- Classes ----------
  async listClasses(academicYearId?: string): Promise<ClassRecord[]> {
    const { data } = await apiClient.get<{
      data: ListResult<ClassRecord>;
    }>("/classes", {
      ...(academicYearId ? { params: { academicYearId } } : {}),
    });
    return data.data.items;
  },
  async getClass(id: string): Promise<ClassRecord> {
    const { data } = await apiClient.get<{ data: ClassRecord }>(`/classes/${id}`);
    return data.data;
  },
  async createClass(payload: { name: string; sections?: string[] }): Promise<ClassRecord> {
    const { data } = await apiClient.post<{ data: ClassRecord }>("/classes", payload);
    return data.data;
  },
  async updateClass(id: string, payload: { name?: string }): Promise<ClassRecord> {
    const { data } = await apiClient.patch<{ data: ClassRecord }>(`/classes/${id}`, payload);
    return data.data;
  },
  async deleteClass(id: string): Promise<void> {
    await apiClient.delete(`/classes/${id}`);
  },

  // ---------- Sections ----------
  async listSections(classId: string): Promise<SectionRecord[]> {
    const { data } = await apiClient.get<{ data: SectionRecord[] }>(`/classes/${classId}/sections`);
    return data.data;
  },
  async createSection(
    classId: string,
    payload: {
      name: string;
      capacity?: number;
      shiftId?: string;
      houseId?: string;
      classTeacherId?: string;
    },
  ): Promise<SectionRecord> {
    const { data } = await apiClient.post<{ data: SectionRecord }>(
      `/classes/${classId}/sections`,
      payload,
    );
    return data.data;
  },
  async updateSection(
    id: string,
    payload: {
      name?: string;
      capacity?: number;
      shiftId?: string;
      houseId?: string;
      classTeacherId?: string;
    },
  ): Promise<SectionRecord> {
    const { data } = await apiClient.patch<{ data: SectionRecord }>(`/sections/${id}`, payload);
    return data.data;
  },
  async deleteSection(id: string): Promise<void> {
    await apiClient.delete(`/sections/${id}`);
  },

  // ---------- Class students (roster) ----------
  async listClassStudents(classId: string): Promise<ClassStudentRow[]> {
    const { data } = await apiClient.get<{ data: ClassStudentRow[] }>(
      `/classes/${classId}/students`,
    );
    return data.data;
  },

  // ---------- Class subjects ----------
  async listClassSubjects(classId: string): Promise<ClassSubjectRecord[]> {
    const { data } = await apiClient.get<{ data: ClassSubjectRecord[] }>(
      `/classes/${classId}/subjects`,
    );
    return data.data;
  },
  async addClassSubject(
    classId: string,
    payload: { subjectId: string; isElectiveGroup?: boolean },
  ): Promise<ClassSubjectRecord> {
    const { data } = await apiClient.post<{ data: ClassSubjectRecord }>(
      `/classes/${classId}/subjects`,
      payload,
    );
    return data.data;
  },
  async removeClassSubject(classId: string, subjectId: string): Promise<void> {
    await apiClient.delete(`/classes/${classId}/subjects/${subjectId}`);
  },

  // ---------- Teacher: own assigned classes & sections ----------
  // Uses GET /attendance/my-sections which already resolves the teacher's
  // TeacherClassAssignment rows filtered to the active academic year.
  async getMyAssignedClasses(): Promise<
    { classId: string; className: string; sections: { sectionId: string; sectionName: string }[] }[]
  > {
    const { data } = await apiClient.get<{
      data: {
        items: { sectionId: string; sectionName: string; classId: string; className: string }[];
        academicYearId: string;
      };
    }>("/attendance/my-sections");

    // Group sections by classId
    const classMap = new Map<
      string,
      { classId: string; className: string; sections: { sectionId: string; sectionName: string }[] }
    >();
    for (const item of data.data.items) {
      if (!classMap.has(item.classId)) {
        classMap.set(item.classId, {
          classId: item.classId,
          className: item.className,
          sections: [],
        });
      }
      classMap
        .get(item.classId)!
        .sections.push({ sectionId: item.sectionId, sectionName: item.sectionName });
    }
    return [...classMap.values()];
  },
  async listDepartments(): Promise<DepartmentRecord[]> {
    return getItems<DepartmentRecord>("/departments");
  },
  async getDepartment(id: string): Promise<DepartmentRecord> {
    const { data } = await apiClient.get<{ data: DepartmentRecord }>(`/departments/${id}`);
    return data.data;
  },
  async createDepartment(payload: {
    name: string;
    description?: string;
  }): Promise<DepartmentRecord> {
    const { data } = await apiClient.post<{ data: DepartmentRecord }>("/departments", payload);
    return data.data;
  },
  // The head must already belong to the department (teacher or staff), so
  // heads are assigned after creation; passing null clears an assigned head.
  async updateDepartment(
    id: string,
    payload: {
      headTeacherId?: string | null;
      headStaffId?: string | null;
      name?: string;
      description?: string;
    },
  ): Promise<DepartmentRecord> {
    const { data } = await apiClient.patch<{ data: DepartmentRecord }>(
      `/departments/${id}`,
      payload,
    );
    return data.data;
  },
  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  },

  // ---------- Subjects ----------
  async listSubjects(): Promise<SubjectRecord[]> {
    return getItems<SubjectRecord>("/subjects");
  },
  async getSubject(id: string): Promise<SubjectRecord> {
    const { data } = await apiClient.get<{ data: SubjectRecord }>(`/subjects/${id}`);
    return data.data;
  },
  async createSubject(payload: {
    name: string;
    code?: string;
    type?: "COMPULSORY" | "ELECTIVE";
    department?: string;
  }): Promise<SubjectRecord> {
    const { data } = await apiClient.post<{ data: SubjectRecord }>("/subjects", payload);
    return data.data;
  },
  // The department is matched by NAME (created if missing); sending "" clears it.
  async updateSubject(
    id: string,
    payload: {
      name?: string;
      code?: string;
      type?: "COMPULSORY" | "ELECTIVE";
      department?: string;
    },
  ): Promise<SubjectRecord> {
    const { data } = await apiClient.patch<{ data: SubjectRecord }>(`/subjects/${id}`, payload);
    return data.data;
  },
  async deleteSubject(id: string): Promise<void> {
    await apiClient.delete(`/subjects/${id}`);
  },

  // ---------- Sessions ----------
  async listSessions(): Promise<SessionRecord[]> {
    return getItems<SessionRecord>("/academic-sessions");
  },
  async getSession(id: string): Promise<SessionRecord> {
    const { data } = await apiClient.get<{ data: SessionRecord }>(`/academic-sessions/${id}`);
    return data.data;
  },
  async createSession(payload: {
    label: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
  }): Promise<SessionRecord> {
    const { data } = await apiClient.post<{ data: SessionRecord }>("/academic-sessions", payload);
    return data.data;
  },
  async updateSession(
    id: string,
    payload: { label?: string; startDate?: string; endDate?: string; isActive?: boolean },
  ): Promise<SessionRecord> {
    const { data } = await apiClient.patch<{ data: SessionRecord }>(
      `/academic-sessions/${id}`,
      payload,
    );
    return data.data;
  },
  async deleteSession(id: string): Promise<void> {
    await apiClient.delete(`/academic-sessions/${id}`);
  },
};

export default academicApi;
