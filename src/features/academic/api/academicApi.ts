import { apiClient } from "@/shared/lib/apiClient";

export interface ClassRecord {
  id: string;
  name: string;
  sections: string[];
  students: number;
  sortOrder: number;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  head: string;
  description: string;
  staffCount: number;
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
    headName?: string;
    description?: string;
  }): Promise<DepartmentRecord> {
    const { data } = await apiClient.post<{ data: DepartmentRecord }>(
      "/departments",
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
};

export default academicApi;