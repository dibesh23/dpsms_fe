"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "../../../features/auth/components/ResetPasswordForm";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");

  if (!token) {
    return (
      <>
        <div className="mb-8">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Invalid link
          </h2>
          <p className="text-sm text-gray-500">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="block w-full py-2.5 text-center bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Set new password
        </h2>
        <p className="text-sm text-gray-500">
          Choose a strong password for your account.
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
