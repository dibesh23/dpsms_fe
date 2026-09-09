import React from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "../../../features/auth/components/ForgotPasswordForm";

const DEFAULT_TENANT_ID = process.env["NEXT_PUBLIC_TENANT_ID"] ?? "";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="type-page-title text-center">Reset your password</h1>
      <p className="type-body-secondary mt-1 text-center">
        Enter your email and we&apos;ll send a reset link if an account exists.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm defaultTenantId={DEFAULT_TENANT_ID} />
      </div>

      <p className="type-body-secondary mt-6 text-center font-medium">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
