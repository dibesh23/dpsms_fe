import React, { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "../../../features/auth/components/LoginForm";
import { LoginOAuthAlert } from "../../../features/auth/components/LoginOAuthAlert";

const DEFAULT_TENANT_ID = process.env["NEXT_PUBLIC_TENANT_ID"] ?? "";
const OAUTH_ENABLED =
  process.env["NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED"] === "true";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h3 className="text-center text-xl font-semibold">
        Log in to your account
      </h3>

      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginOAuthAlert />
        </Suspense>
        <LoginForm
          defaultTenantId={DEFAULT_TENANT_ID}
          oauthEnabled={OAUTH_ENABLED}
        />
      </div>

      <p className="mt-6 text-center text-sm font-medium text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}