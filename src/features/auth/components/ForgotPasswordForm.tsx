"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { authApi } from "../api/authApi";

const ForgotSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  tenantId: z
    .string()
    .refine((value) => value === "" || z.uuid().safeParse(value).success, "Invalid tenant ID")
    .optional(),
});
type ForgotFormValues = z.infer<typeof ForgotSchema>;

export function ForgotPasswordForm({ defaultTenantId = "" }: { defaultTenantId?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { tenantId: defaultTenantId },
  });

  const onSubmit = async ({ email, tenantId }: ForgotFormValues) => {
    setApiError(null);
    try {
      await authApi.forgotPassword(email, tenantId || undefined);
      setSubmitted(true);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        setApiError("Too many reset requests. Please wait a few minutes and try again.");
      } else if (status && status >= 500) {
        setApiError(
          "The reset email service is temporarily unavailable. Please try again shortly.",
        );
      } else {
        setApiError("We couldn't reach the server. Check your connection and try again.");
      }
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="type-page-title">Check your inbox</h2>
        <p className="type-body-reading text-neutral-600">
          If that email is registered, a reset link has been sent. Check your spam folder too.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full flex-col gap-y-6">
      <label>
        <span className="type-label mb-2 block">Work email</span>
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

      <input type="hidden" {...register("tenantId")} />

      {apiError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {apiError}
        </div>
      )}

      <Button
        type="submit"
        text={isSubmitting ? "Sending..." : "Send reset link"}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </form>
  );
}
