"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { AuthMethodsSeparator } from "@/shared/components/auth-methods-separator";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuth } from "../hooks/useAuth";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  tenantId: z.string().uuid("Invalid tenant ID"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  defaultTenantId?: string;
  oauthEnabled?: boolean;
}

export function LoginForm({
  defaultTenantId = "",
  oauthEnabled = false,
}: LoginFormProps) {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { tenantId: defaultTenantId },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      await login(values);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Invalid email or password.";
      setApiError(msg);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex w-full flex-col gap-y-6"
      >
        <label>
          <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
            Work email
          </span>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            autoFocus
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </label>

        <label>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-content-emphasis block text-sm font-medium leading-none">
              Password
            </span>
            <Link
              href="/forgot-password"
              className="text-content-subtle hover:text-content-emphasis text-xs leading-none underline underline-offset-2 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isSubmitting}
            error={errors.password?.message}
            {...register("password")}
          />
        </label>

        <input type="hidden" {...register("tenantId")} />

        {apiError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {apiError}
          </div>
        )}

        <Button
          text={isSubmitting ? "Logging in..." : "Log in"}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </form>

      {oauthEnabled && (
        <>
          <AuthMethodsSeparator />
          <GoogleSignInButton tenantId={defaultTenantId} />
        </>
      )}
    </div>
  );
}