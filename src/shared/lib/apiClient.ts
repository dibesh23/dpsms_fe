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

const API_BASE_URL = (process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000").replace(
  /\/+$/,
  "",
);

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

  const body = (config.data ?? {}) as Record<string, unknown>;
  const hasExplicitScope =
    (typeof body.tenantId === "string" && body.tenantId.length > 0) ||
    (typeof body.subdomain === "string" && body.subdomain.length > 0);
  if (hasExplicitScope) {
    const subdomain = getLastSchool()?.subdomain;
    if (subdomain) {
      config.headers["X-Tenant-Subdomain"] = subdomain;
    }
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
      originalConfig.url = `${originalConfig.baseURL}${originalConfig.url}`.replace(/\/{2,}/g, "/");
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
