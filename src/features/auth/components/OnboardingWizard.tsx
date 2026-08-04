"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../hooks/useOnboarding";
import type { OnboardingStepState } from "../types";

function StepItem({
  step,
  isCurrent,
  onComplete,
}: {
  step: OnboardingStepState;
  isCurrent: boolean;
  onComplete: (key: string) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCompleted = step.status === "COMPLETED";

  const handleComplete = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onComplete(step.key);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabel = step.key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : isCurrent
            ? "bg-blue-50 border-blue-200"
            : "bg-gray-50 border-gray-200"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCompleted
            ? "bg-green-500"
            : isCurrent
              ? "bg-blue-600"
              : "bg-gray-300"
        }`}
      >
        {isCompleted ? (
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="text-white text-xs font-bold">
            {isCurrent ? "→" : "○"}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${isCompleted ? "text-green-800" : isCurrent ? "text-blue-900" : "text-gray-500"}`}
        >
          {stepLabel}
        </p>
        {step.completedAt && (
          <p className="text-xs text-green-600 mt-0.5">
            Completed {new Date(step.completedAt).toLocaleDateString()}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-600 mt-1">
            {error}
          </p>
        )}
        {isCurrent && !isCompleted && (
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg
              transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-3 h-3 animate-spin"
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
                Saving…
              </>
            ) : (
              "Complete step"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const { status, isLoading, error, completeStep } = useOnboarding();

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        {error ?? "Failed to load onboarding status."}
      </div>
    );
  }

  const completedCount = status.steps.filter(
    (s) => s.status === "COMPLETED",
  ).length;
  const totalCount = status.steps.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleStepComplete = async (stepKey: string) => {
    const result = await completeStep(stepKey);
    if (!result.nextStep) router.push("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span>
            {completedCount} of {totalCount} steps
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
          />
        </div>
      </div>

      <div className="space-y-3">
        {status.steps.map((step) => (
          <StepItem
            key={step.key}
            step={step}
            isCurrent={step.key === status.nextStep}
            onComplete={handleStepComplete}
          />
        ))}
      </div>

      {status.completedAt && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <p className="text-sm font-semibold text-green-800">
            All steps complete! Redirecting to dashboard…
          </p>
        </div>
      )}
    </div>
  );
}
