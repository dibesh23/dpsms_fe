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
  RegisterPayload,
} from "../../features/auth/types";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(payload: LoginPayload): Promise<void>;
  register(payload: RegisterPayload): Promise<void>;
  logout(): Promise<void>;
  refreshToken(): Promise<boolean>;
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
        if (!cancelled) setIsLoading(false);
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


  const register = useCallback(
    async (payload: RegisterPayload): Promise<void> => {
      const result = await authApi.register(payload);
      accessTokenRef.current = result.accessToken;
      setUser(result.user);
      router.push("/onboarding");
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      refreshToken,
    }),
    [user, isLoading, login, register, logout, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
