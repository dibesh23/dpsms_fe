"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { AuthMethodsSeparator } from "@/shared/components/auth-methods-separator";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuth } from "../hooks/useAuth";

const RegisterSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required").max(255),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "At least 8 characters").max(128),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    tenantId: z.string().uuid("Invalid tenant ID"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof RegisterSchema>;

interface RegisterFormProps {
  defaultTenantId?: string;
  oauthEnabled?: boolean;
}

export function RegisterForm({
  defaultTenantId = "",
  oauthEnabled = false,
}: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { tenantId: defaultTenantId },
  });

  const onSubmit = async ({
    fullName,
    email,
    password,
    tenantId,
  }: RegisterFormValues) => {
    setApiError(null);
    try {
      await registerUser({ fullName, email, password, tenantId });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        "Registration failed. Please try again.";
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
            Full name
          </span>
          <Input
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            autoFocus
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </label>

        <label>
          <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
            Work email
          </span>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </label>

        <label>
          <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
            Password
          </span>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            disabled={isSubmitting}
            error={errors.password?.message}
            {...register("password")}
          />
        </label>

        <label>
          <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
            Confirm password
          </span>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            disabled={isSubmitting}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
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
          text={isSubmitting ? "Creating account..." : "Create account"}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </form>

      {oauthEnabled && (
        <>
          <AuthMethodsSeparator />
          <GoogleSignInButton
            tenantId={defaultTenantId}
            label="Sign up with Google"
          />
        </>
      )}
    </div>
  );
}