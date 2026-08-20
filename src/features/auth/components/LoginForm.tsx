"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Building2Icon } from "@/shared/components/ui/icons";
import { AuthMethodsSeparator } from "@/shared/components/auth-methods-separator";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuth } from "../hooks/useAuth";
import { saveLastSchool } from "../../../shared/lib/schoolStorage";

const LoginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
  tenantId: z.uuid("Invalid tenant ID").optional(),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  defaultTenantId?: string;
  schoolName?: string | null;
  oauthEnabled?: boolean;
}

export function LoginForm({
  defaultTenantId = "",
  schoolName,
  oauthEnabled = false,
}: LoginFormProps) {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { tenantId: defaultTenantId },
  });

  useEffect(() => {
    if (defaultTenantId) setValue("tenantId", defaultTenantId);
  }, [defaultTenantId, setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      await login({
        email: values.email,
        password: values.password,
        tenantId: values.tenantId || undefined,
      });
      if (values.tenantId) saveLastSchool({ tenantId: values.tenantId });
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
        {schoolName && (
          <p className="text-content-subtle flex items-center justify-center gap-1.5 text-xs">
            <Building2Icon className="size-3.5" />
            Logging in to <span className="font-semibold text-neutral-700">{schoolName}</span>
          </p>
        )}

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
