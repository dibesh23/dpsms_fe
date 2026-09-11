import { apiClient } from "../../../shared/lib/apiClient";
import {
  clearTabRefreshToken,
  getTabRefreshToken,
  setTabRefreshToken,
} from "../../../shared/lib/tabSession";
import type {
  LoginPayload,
  LoginResponse,
  RegisterSchoolPayload,
  RegisterSchoolResponse,
  AuthUser,
  RefreshResponse,
  SessionInfo,
} from "../types";

export const authApi = {
  async registerSchool(payload: RegisterSchoolPayload): Promise<RegisterSchoolResponse> {
    const { data } = await apiClient.post<RegisterSchoolResponse>("/auth/register", payload);
    if (data.refreshToken) setTabRefreshToken(data.refreshToken);
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

  async resolveTenant(subdomain: string): Promise<{ tenantId: string; name: string } | null> {
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
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
    if (data.refreshToken) setTabRefreshToken(data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      const token = getTabRefreshToken();
      await apiClient.post("/auth/logout", token ? { refreshToken: token } : {});
    } finally {
      clearTabRefreshToken();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiClient.post("/auth/logout-all");
    } finally {
      clearTabRefreshToken();
    }
  },

  async refresh(): Promise<RefreshResponse> {
    const tabToken = getTabRefreshToken();
    const { data } = await apiClient.post<RefreshResponse>(
      "/auth/refresh",
      {},
      tabToken ? { headers: { "X-Refresh-Token": tabToken } } : undefined,
    );
    if (data.refreshToken) setTabRefreshToken(data.refreshToken);
    return data;
  },

  async forgotPassword(email: string, tenantId?: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", tenantId ? { email, tenantId } : { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/reset-password", { token, newPassword });
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.get("/auth/verify-email", { params: { token } });
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>("/me");
    return data;
  },

  async listSessions(): Promise<{ sessions: SessionInfo[] }> {
    const { data } = await apiClient.get<{ sessions: SessionInfo[] }>("/sessions");
    return data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/sessions/${sessionId}`);
  },
};

export default authApi;
