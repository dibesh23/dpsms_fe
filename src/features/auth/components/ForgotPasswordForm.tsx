"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "../api/authApi";

const ForgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  tenantId: z.string().uuid("Invalid tenant ID"),
});
type ForgotFormValues = z.infer<typeof ForgotSchema>;

export function ForgotPasswordForm({
  defaultTenantId = "",
}: {
  defaultTenantId?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { tenantId: defaultTenantId },
  });

  const onSubmit = async ({ email, tenantId }: ForgotFormValues) => {
    try {
      await authApi.forgotPassword(email, tenantId);
    } catch {

    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check your inbox
        </h3>
        <p className="text-sm text-gray-500">
          If that email is registered, a reset link has been sent. Check your
          spam folder too.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="forgot-email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Email address
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50
            ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="mt-1.5 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>
      <input type="hidden" {...register("tenantId")} />
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
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
