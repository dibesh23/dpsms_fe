import React, { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "../../../features/auth/components/LoginForm";
import { GoogleSignInButton } from "../../../features/auth/components/GoogleSignInButton";
import { LoginOAuthAlert } from "../../../features/auth/components/LoginOAuthAlert";

const DEFAULT_TENANT_ID = process.env["NEXT_PUBLIC_TENANT_ID"] ?? "";
const OAUTH_ENABLED =
  process.env["NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED"] === "true";

export default function LoginPage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500">
          Sign in to your school management account
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginOAuthAlert />
      </Suspense>

      <LoginForm defaultTenantId={DEFAULT_TENANT_ID} />

      <div className="mt-4 text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-700 hover:text-blue-900 font-medium"
        >
          Forgot password?
        </Link>
      </div>

      {OAUTH_ENABLED && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">
                or continue with
              </span>
            </div>
          </div>

          <GoogleSignInButton tenantId={DEFAULT_TENANT_ID} />
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
