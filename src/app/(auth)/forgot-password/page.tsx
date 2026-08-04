import React from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "../../../features/auth/components/ForgotPasswordForm";

const DEFAULT_TENANT_ID = process.env["NEXT_PUBLIC_TENANT_ID"] ?? "";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Forgot password?
        </h2>
        <p className="text-sm text-gray-500">
          Enter your email and we&apos;ll send a reset link if an account
          exists.
        </p>
      </div>
      <ForgotPasswordForm defaultTenantId={DEFAULT_TENANT_ID} />
      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
