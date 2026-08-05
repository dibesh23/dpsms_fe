import React from "react";
import { OnboardingWizard } from "../../../features/auth/components/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center text-center">
        <h3 className="text-xl font-semibold">
          Welcome! Let&apos;s get set up
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Complete the steps below to activate your account.
        </p>
      </div>

      <div className="mt-8">
        <OnboardingWizard />
      </div>
    </div>
  );
}