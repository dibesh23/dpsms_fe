"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50
    ${hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}`;

  const onSubmit = async ({ newPassword }: ResetFormValues) => {
    setApiError(null);
    try {
      await authApi.resetPassword(token, newPassword);
      router.push("/login?message=password-reset");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        "Failed to reset password. The link may have expired.";
      setApiError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          disabled={isSubmitting}
          aria-invalid={!!errors.newPassword}
          className={inputClass(!!errors.newPassword)}
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p role="alert" className="mt-1.5 text-xs text-red-600">
            {errors.newPassword.message}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          disabled={isSubmitting}
          aria-invalid={!!errors.confirmPassword}
          className={inputClass(!!errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p role="alert" className="mt-1.5 text-xs text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      {apiError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Resetting…
          </>
        ) : (
          "Reset password"
        )}
      </button>
    </form>
  );
}
