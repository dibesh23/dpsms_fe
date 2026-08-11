import { apiClient } from "../../../shared/lib/apiClient";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  AuthUser,
  OnboardingStatusResult,
  SessionInfo,
} from "../types";

export const authApi = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>(
      "/auth/register",
      payload,
    );
    return data;
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

  async forgotPassword(email: string, tenantId: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email, tenantId });
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
