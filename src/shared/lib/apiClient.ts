"use client";

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { getLastSchool } from "./schoolStorage";

let accessTokenRef: (() => string | null) | null = null;

let refreshTokenRef: (() => Promise<boolean>) | null = null;

let refreshPromise: Promise<boolean> | null = null;

export function setAccessTokenRef(getter: () => string | null): void {
  accessTokenRef = getter;
}

export function setRefreshTokenRef(fn: () => Promise<boolean>): void {
  refreshTokenRef = fn;
}

const API_BASE_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = accessTokenRef?.();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  // Advisory tenant hint for pre-auth flows (login, forgot-password): lets the
  // backend scope lookups to the chosen school and attribute audit events.
  // Authorization itself always comes from the JWT — never from this header.
  const subdomain = getLastSchool()?.subdomain;
  if (subdomain) {
    config.headers["X-Tenant-Subdomain"] = subdomain;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalConfig = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isRefreshEndpoint = originalConfig?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalConfig._retry &&
      !isRefreshEndpoint &&
      refreshTokenRef
    ) {
      originalConfig._retry = true;
      try {
        refreshPromise ??= refreshTokenRef().finally(() => {
          refreshPromise = null;
        });
        const refreshed = await refreshPromise;

        if (refreshed) {
          const newToken = accessTokenRef?.();
          if (newToken) {
            originalConfig.headers["Authorization"] = `Bearer ${newToken}`;
          }
          return apiClient(originalConfig);
        }
      } catch {
        refreshPromise = null;
      }
    }

    return Promise.reject(error as Error);
  },
);

export default apiClient;
