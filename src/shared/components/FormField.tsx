"use client";

import React from "react";

export function inputClasses(hasError = false): string {
  return `w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors outline-none
    placeholder:text-slate-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
    focus:ring-2 focus:ring-[#156d39]/25 focus:border-[#156d39]
    ${
      hasError
        ? "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-200"
        : "border-slate-300 bg-white hover:border-slate-400"
    }`;
}

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  children: React.ReactElement<
    React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
  >;
}

export function FormField({ label, id, error, children }: FormFieldProps) {
  const field = React.cloneElement(children, {
    id,
    "aria-invalid": Boolean(error) || undefined,
    ...(error
      ? { "aria-describedby": `${id}-error` }
      : children.props["aria-describedby"]
        ? { "aria-describedby": children.props["aria-describedby"] }
        : {}),
  });

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {field}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700"
        >
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "className"
  > {
  showPassword: boolean;
  onToggleVisibility: () => void;
  hasError?: boolean;
}

export function PasswordInput({
  showPassword,
  onToggleVisibility,
  hasError,
  ...props
}: PasswordInputProps) {
  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        className={`${inputClasses(hasError)} pr-11`}
        {...props}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-pressed={showPassword}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#156d39] rounded-r-xl"
      >
        {showPassword ? (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
