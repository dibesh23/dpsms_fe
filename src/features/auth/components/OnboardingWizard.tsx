"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "../hooks/useOnboarding";
import { useAuth } from "../hooks/useAuth";
import type { OnboardingStepState } from "../types";
import { LoadingSpinner } from "@/shared/components/ui/icons";

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
      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
        isCompleted
          ? "border-neutral-200 bg-neutral-50"
          : isCurrent
            ? "border-neutral-900"
            : "border-neutral-200 bg-white"
      }`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isCompleted
            ? "bg-black text-white"
            : isCurrent
              ? "bg-black text-white"
              : "bg-neutral-200 text-neutral-500"
        }`}
      >
        {isCompleted ? (
          <svg
            className="h-4 w-4"
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
          <span className="text-xs font-bold">
            {isCurrent ? "→" : "•"}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${
            isCompleted || isCurrent
              ? "text-neutral-900"
              : "text-neutral-500"
          }`}
        >
          {stepLabel}
        </p>
        {step.completedAt && (
          <p className="mt-0.5 text-xs text-neutral-500">
            Completed {new Date(step.completedAt).toLocaleDateString()}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
        {isCurrent && !isCompleted && (
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {isSubmitting ? (
              <LoadingSpinner className="h-3 w-3" />
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
  const { refreshToken } = useAuth();
  const { status, isLoading, error, completeStep } = useOnboarding();

  const goToDashboard = useCallback(async () => {
    try {
      await refreshToken();
    } finally {
      router.push("/dashboard");
    }
  }, [refreshToken, router]);

  useEffect(() => {
    if (status?.completedAt) {
      void goToDashboard();
    }
  }, [status?.completedAt, goToDashboard]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
    if (!result.nextStep) {
      await goToDashboard();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex justify-between text-xs text-neutral-500">
          <span>Progress</span>
          <span>
            {completedCount} of {totalCount} steps
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-black transition-all duration-500"
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
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-center">
          <p className="text-sm font-semibold text-neutral-900">
            All steps complete! Redirecting to dashboard…
          </p>
        </div>
      )}
    </div>
  );
}