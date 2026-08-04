"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-50 disabled:cursor-not-allowed
  ${hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}`;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p
      role="alert"
      className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
    >
      <svg
        className="w-3.5 h-3.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {msg}
    </p>
  ) : null;

export function RegisterForm({
  defaultTenantId = "",
}: {
  defaultTenantId?: string;
}) {
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          disabled={isSubmitting}
          aria-invalid={!!errors.fullName}
          className={inputClass(!!errors.fullName)}
          {...register("fullName")}
        />
        <FieldError msg={errors.fullName?.message} />
      </div>

      <div>
        <label
          htmlFor="reg-email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Email address
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          className={inputClass(!!errors.email)}
          {...register("email")}
        />
        <FieldError msg={errors.email?.message} />
      </div>

      <div>
        <label
          htmlFor="reg-password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          disabled={isSubmitting}
          aria-invalid={!!errors.password}
          className={inputClass(!!errors.password)}
          {...register("password")}
        />
        <FieldError msg={errors.password?.message} />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          disabled={isSubmitting}
          aria-invalid={!!errors.confirmPassword}
          className={inputClass(!!errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        <FieldError msg={errors.confirmPassword?.message} />
      </div>

      <input type="hidden" {...register("tenantId")} />

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
        aria-busy={isSubmitting}
        className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 active:bg-blue-950
          text-white text-sm font-semibold rounded-lg transition-colors mt-2
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
}
