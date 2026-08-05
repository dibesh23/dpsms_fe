import React from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "../../../features/auth/components/ForgotPasswordForm";

const DEFAULT_TENANT_ID = process.env["NEXT_PUBLIC_TENANT_ID"] ?? "";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <h3 className="text-center text-xl font-semibold">
        Reset your password
      </h3>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Enter your email and we&apos;ll send a reset link if an account exists.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm defaultTenantId={DEFAULT_TENANT_ID} />
      </div>

      <p className="mt-6 text-center text-sm font-medium text-neutral-500">
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