"use client";

import { useState, useEffect, useCallback } from "react";
import { authApi } from "../api/authApi";
import type { OnboardingStatusResult } from "../types";

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatusResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .getOnboardingStatus()
      .then(setStatus)
      .catch(() => setError("Failed to load onboarding status"))
      .finally(() => setIsLoading(false));
  }, []);

  const completeStep = useCallback(
    async (stepKey: string): Promise<OnboardingStatusResult> => {
      const result = await authApi.completeOnboardingStep(stepKey);
      setStatus(result);
      return result;
    },
    [],
  );

  return { status, isLoading, error, completeStep };
}
