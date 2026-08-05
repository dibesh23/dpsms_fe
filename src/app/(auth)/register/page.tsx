import React from "react";
import Link from "next/link";
import { RegisterForm } from "../../../features/auth/components/RegisterForm";

const DEFAULT_TENANT_ID = process.env["NEXT_PUBLIC_TENANT_ID"] ?? "";
const OAUTH_ENABLED =
  process.env["NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED"] === "true";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h3 className="text-center text-xl font-semibold">Create your account</h3>

      <div className="mt-8">
        <RegisterForm
          defaultTenantId={DEFAULT_TENANT_ID}
          oauthEnabled={OAUTH_ENABLED}
        />
      </div>

      <p className="mt-6 text-center text-sm font-medium text-neutral-500">
        Already have an account?{" "}
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