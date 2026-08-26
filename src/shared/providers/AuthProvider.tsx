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
import { PERMISSIONS as P, type PermissionKey } from "../permissions";

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

const ROLE_FALLBACK_PERMISSIONS: Record<string, readonly PermissionKey[]> = {
  SUPER_ADMIN: Object.values(P) as readonly PermissionKey[],
  PRINCIPAL: Object.values(P) as readonly PermissionKey[],
  TEACHER: [
    P.DASHBOARD_VIEW,
    P.TEACHER_OWN_CLASSES_VIEW,
    P.STUDENT_LIST,
    P.PARENT_LIST,
    P.ACADEMIC_CLASS_LIST,
    P.ACADEMIC_CLASS_READ,
    P.ACADEMIC_SUBJECT_LIST,
    P.ACADEMIC_DEPARTMENT_LIST,
    P.ACADEMIC_SESSION_LIST,
    P.EXAM_OWN_VIEW,
    P.ATTENDANCE_OWN_VIEW,
    P.ATTENDANCE_STUDENT_MARK,
    P.ATTENDANCE_STUDENT_LIST,
    P.ATTENDANCE_STAFF_READ,
    P.NOTICE_OWN_VIEW,
    P.NOTICE_LIST,
    P.NOTICE_CREATE,  // teachers can post notices to their own classes
    P.MESSAGING_OWN_VIEW,
  ],
  STUDENT: [
    P.DASHBOARD_VIEW,
    P.ATTENDANCE_OWN_VIEW,
    P.ATTENDANCE_STUDENT_READ,
    P.EXAM_OWN_VIEW,
    P.FEE_OWN_VIEW,
    P.NOTICE_OWN_VIEW,
    P.TIMETABLE_OWN_VIEW,
    P.ASSIGNMENT_OWN_VIEW,
    P.LIVE_CLASS_OWN_VIEW,
    P.ADMISSION_LETTER_VIEW,
  ],
} as const;

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAccessTokenRef(() => accessTokenRef.current);
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const { accessToken, user: refreshedUser } = await authApi.refresh();
      accessTokenRef.current = accessToken;
      setUser(refreshedUser);
      return true;
    } catch {
      accessTokenRef.current = null;
      setUser(null);
      return false;
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
      router.push("/dashboard");
    },
    [router],
  );

  const registerSchool = useCallback(
    async (payload: RegisterSchoolPayload): Promise<RegisterSchoolResponse> => {
      const result = await authApi.registerSchool(payload);
      accessTokenRef.current = result.accessToken;
      setUser(result.user);
      router.push("/dashboard");
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
      router.replace("/login");
    }
  }, [router]);

  const can = useCallback(
    (permission: string): boolean => {
      if (user?.permissions?.includes(permission)) return true;
      const fallbacks = user?.role ? ROLE_FALLBACK_PERMISSIONS[user.role] : undefined;
      return fallbacks?.includes(permission as PermissionKey) ?? false;
    },
    [user?.permissions, user?.role],
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
