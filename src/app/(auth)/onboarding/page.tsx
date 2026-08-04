import React from "react";
import { OnboardingWizard } from "../../../features/auth/components/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <>
      <div className="mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-blue-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome! Let&apos;s get set up
        </h2>
        <p className="text-sm text-gray-500">
          Complete the steps below to activate your account.
        </p>
      </div>
      <OnboardingWizard />
    </>
  );
}
