"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { authApi } from "../api/authApi";

const ResetSchema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters").max(128),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetFormValues = z.infer<typeof ResetSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(ResetSchema),
  });

  const onSubmit = async ({ newPassword }: ResetFormValues) => {
    setApiError(null);
    try {
      await authApi.resetPassword(token, newPassword);
      router.push("/login?message=password-reset");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Failed to reset password. The link may have expired.";
      setApiError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full flex-col gap-y-6">
      <label>
        <span className="type-label mb-2 block">New password</span>
        <Input
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="Min. 8 characters"
          disabled={isSubmitting}
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
      </label>

      <label>
        <span className="type-label mb-2 block">Confirm password</span>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          disabled={isSubmitting}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </label>

      {apiError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {apiError}
        </div>
      )}

      <Button
        text={isSubmitting ? "Resetting..." : "Reset password"}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </form>
  );
}
