import React from "react";
import Link from "next/link";
import { RegisterForm } from "../../../features/auth/components/RegisterForm";
import { GoogleSignInButton } from "../../../features/auth/components/GoogleSignInButton";

const DEFAULT_TENANT_ID = process.env["NEXT_PUBLIC_TENANT_ID"] ?? "";
const OAUTH_ENABLED =
  process.env["NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED"] === "true";

export default function RegisterPage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Create account
        </h2>
        <p className="text-sm text-gray-500">
          Set up your school management account
        </p>
      </div>

      <RegisterForm defaultTenantId={DEFAULT_TENANT_ID} />

      {OAUTH_ENABLED && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">
                or sign up with
              </span>
            </div>
          </div>

          <GoogleSignInButton
            tenantId={DEFAULT_TENANT_ID}
            label="Sign up with Google"
          />
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
