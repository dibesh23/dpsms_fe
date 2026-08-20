"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../features/auth/api/authApi";
import { setAccessTokenRef, setRefreshTokenRef } from "../lib/apiClient";
import type {
  AuthUser,
  LoginPayload,
  RegisterSchoolPayload,
  RegisterSchoolResponse,
} from "../../features/auth/types";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(payload: LoginPayload): Promise<void>;
  registerSchool(payload: RegisterSchoolPayload): Promise<RegisterSchoolResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<boolean>;
  can(permission: string): boolean;
  hasRole(role: AuthUser["role"]): boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  const refreshingRef = useRef(false);


  useEffect(() => {
    setAccessTokenRef(() => accessTokenRef.current);
  }, []);


  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (refreshingRef.current) return false;
    refreshingRef.current = true;
    try {
      const { accessToken, user: refreshedUser } = await authApi.refresh();
      accessTokenRef.current = accessToken;
      setUser(refreshedUser);
      return true;
    } catch {
      accessTokenRef.current = null;
      setUser(null);
      return false;
    } finally {
      refreshingRef.current = false;
    }
  }, []);


  useEffect(() => {
    setRefreshTokenRef(refreshToken);
  }, [refreshToken]);


  const mountedRef = useRef(false);
  useEffect(() => {

    if (mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const { accessToken, user: refreshedUser } = await authApi.refresh();
        if (!cancelled) {
          accessTokenRef.current = accessToken;
          setUser(refreshedUser);
        }
      } catch {

        if (!cancelled) {
          accessTokenRef.current = null;
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };

  }, []);


  const login = useCallback(
    async (payload: LoginPayload): Promise<void> => {
      const result = await authApi.login(payload);
      accessTokenRef.current = result.accessToken;
      setUser(result.user);
      if (result.onboardingRequired) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    },
    [router],
  );


  const registerSchool = useCallback(
    async (
      payload: RegisterSchoolPayload,
    ): Promise<RegisterSchoolResponse> => {
      const result = await authApi.registerSchool(payload);
      accessTokenRef.current = result.accessToken;
      setUser(result.user);
      if (result.onboardingRequired) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
      return result;
    },
    [router],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      accessTokenRef.current = null;
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const can = useCallback(
    (permission: string): boolean => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user?.permissions],
  );

  const hasRole = useCallback(
    (role: AuthUser["role"]): boolean => user?.role === role,
    [user?.role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      registerSchool,
      logout,
      refreshToken,
      can,
      hasRole,
    }),
    [user, isLoading, login, registerSchool, logout, refreshToken, can, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
