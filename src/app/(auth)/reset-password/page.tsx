"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "../../../features/auth/components/ResetPasswordForm";
import { Button } from "@/shared/components/ui/button";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <h3 className="text-center text-xl font-semibold">Invalid link</h3>
        <p className="mt-1 text-center text-sm text-neutral-500">
          This password reset link is invalid or has expired.
        </p>
        <div className="mt-8">
          <Link href="/forgot-password">
            <Button text="Request a new link" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h3 className="text-center text-xl font-semibold">Set new password</h3>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Choose a strong password for your account.
      </p>

      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}