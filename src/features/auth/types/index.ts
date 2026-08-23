export type RoleName = "SUPER_ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";
export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  tenantId: string;
  status: UserStatus;
  permissions: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantId?: string;
  role?: RoleName;
}

export interface RegisterSchoolPayload {
  schoolName: string;
  subdomain: string;
  fullName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterSchoolResponse {
  accessToken: string;
  user: AuthUser;
  tenantId: string;
  schoolName: string;
  subdomain: string;
  message: string;
}

export interface SessionInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}
