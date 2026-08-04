"use client";

import React from "react";

interface SubmitButtonProps {
  isSubmitting: boolean;
  submittingLabel: string;
  children: React.ReactNode;
}

export function SubmitButton({
  isSubmitting,
  submittingLabel,
  children,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#156d39] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors
        hover:bg-[#125d31] active:bg-[#0d3320]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#156d39] focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
          {submittingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
