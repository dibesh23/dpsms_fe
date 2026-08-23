import { apiClient } from "@/shared/lib/apiClient";

export interface ClassRecord {
  id: string;
  name: string;
  sections: string[];
  students: number;
  sortOrder: number;
}

export interface DepartmentHeadRecord {
  id: string;
  fullName: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  headTeacher: DepartmentHeadRecord | null;
  description: string;
  staffCount: number;
  teacherCount: number;
  subjectCount: number;
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
  async listClasses(): Promise<ClassRecord[]> {
    return getItems<ClassRecord>("/classes");
  },
  async createClass(payload: { name: string; sections?: string[] }): Promise<ClassRecord> {
    const { data } = await apiClient.post<{ data: ClassRecord }>("/classes", payload);
    return data.data;
  },

  async listDepartments(): Promise<DepartmentRecord[]> {
    return getItems<DepartmentRecord>("/departments");
  },
  async createDepartment(payload: {
    name: string;
    description?: string;
  }): Promise<DepartmentRecord> {
    const { data } = await apiClient.post<{ data: DepartmentRecord }>(
      "/departments",
      payload,
    );
    return data.data;
  },
  // The head teacher must already belong to the department, so heads are
  // assigned after creation; passing null clears an assigned head.
  async updateDepartment(
    id: string,
    payload: { headTeacherId?: string | null },
  ): Promise<DepartmentRecord> {
    const { data } = await apiClient.patch<{ data: DepartmentRecord }>(
      `/departments/${id}`,
      payload,
    );
    return data.data;
  },

  async listSubjects(): Promise<SubjectRecord[]> {
    return getItems<SubjectRecord>("/subjects");
  },
  async createSubject(payload: {
    name: string;
    code?: string;
    type?: string;
    department?: string;
  }): Promise<SubjectRecord> {
    const { data } = await apiClient.post<{ data: SubjectRecord }>("/subjects", payload);
    return data.data;
  },

  async listSessions(): Promise<SessionRecord[]> {
    return getItems<SessionRecord>("/academic-sessions");
  },
  async createSession(payload: {
    label: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
  }): Promise<SessionRecord> {
    const { data } = await apiClient.post<{ data: SessionRecord }>(
      "/academic-sessions",
      payload,
    );
    return data.data;
  },
  async updateSession(
    id: string,
    payload: { isActive?: boolean },
  ): Promise<SessionRecord> {
    const { data } = await apiClient.patch<{ data: SessionRecord }>(
      `/academic-sessions/${id}`,
      payload,
    );
    return data.data;
  },

  async listSections(classId: string): Promise<SectionRecord[]> {
    const { data } = await apiClient.get<{ data: SectionRecord[] }>(
      `/classes/${classId}/sections`,
    );
    return data.data;
  },
  async updateSection(
    id: string,
    payload: { classTeacherId?: string },
  ): Promise<SectionRecord> {
    const { data } = await apiClient.patch<{ data: SectionRecord }>(
      `/sections/${id}`,
      payload,
    );
    return data.data;
  },
};

export default academicApi;