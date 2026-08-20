import { apiClient } from "../../../shared/lib/apiClient";
import type {
  LoginPayload,
  LoginResponse,
  RegisterSchoolPayload,
  RegisterSchoolResponse,
  AuthUser,
  OnboardingStatusResult,
  SessionInfo,
} from "../types";

export const authApi = {
  async registerSchool(
    payload: RegisterSchoolPayload,
  ): Promise<RegisterSchoolResponse> {
    const { data } = await apiClient.post<RegisterSchoolResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  async checkSubdomain(subdomain: string): Promise<boolean> {
    try {
      await apiClient.get(`/tenant/${encodeURIComponent(subdomain)}`);
      return false;
    } catch {
      return true;
    }
  },

  async resolveTenant(
    subdomain: string,
  ): Promise<{ tenantId: string; name: string } | null> {
    try {
      const { data } = await apiClient.get<{
        tenantId: string;
        name: string;
        subdomain: string;
      }>(`/tenant/${encodeURIComponent(subdomain)}`);
      return { tenantId: data.tenantId, name: data.name };
    } catch {
      return null;
    }
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async logoutAll(): Promise<void> {
    await apiClient.post("/auth/logout-all");
  },

  async refresh(): Promise<{ accessToken: string; user: AuthUser }> {
    const { data } = await apiClient.post<{
      accessToken: string;
      user: AuthUser;
    }>("/auth/refresh");
    return data;
  },

  async forgotPassword(email: string, tenantId?: string): Promise<void> {
    await apiClient.post(
      "/auth/forgot-password",
      tenantId ? { email, tenantId } : { email },
    );
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { token, newPassword });
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>("/me");
    return data;
  },

  async getOnboardingStatus(): Promise<OnboardingStatusResult> {
    const { data } =
      await apiClient.get<OnboardingStatusResult>("/onboarding/status");
    return data;
  },

  async completeOnboardingStep(
    stepKey: string,
  ): Promise<OnboardingStatusResult> {
    const { data } = await apiClient.post<OnboardingStatusResult>(
      `/onboarding/steps/${stepKey}/complete`,
    );
    return data;
  },

  async listSessions(): Promise<{ sessions: SessionInfo[] }> {
    const { data } = await apiClient.get<{ sessions: SessionInfo[] }>(
      "/sessions",
    );
    return data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/sessions/${sessionId}`);
  },
};

export default authApi;
