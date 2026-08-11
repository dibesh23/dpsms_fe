
export type RoleName = "SUPER_ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";
export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  tenantId: string;
  status: UserStatus;
  onboardingRequired: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantId: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  tenantId: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  onboardingRequired: boolean;
}

export interface RegisterResponse {
  accessToken: string;
  user: AuthUser;
  onboardingRequired: boolean;
}

export interface OnboardingStepState {
  key: string;
  status: "PENDING" | "COMPLETED";
  completedAt: string | null;
}

export interface OnboardingStatusResult {
  steps: OnboardingStepState[];
  completedAt: string | null;
  nextStep: string | null;
}

export interface SessionInfo {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}
