import React, { Suspense } from "react";
import Link from "next/link";
import { LoginWithSchoolContext } from "../../../features/auth/components/LoginWithSchoolContext";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="type-page-title text-center">Log in to your account</h1>

      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginWithSchoolContext />
        </Suspense>
      </div>

      <p className="type-body-secondary mt-6 text-center font-medium">
        Don&apos;t have a school account?{" "}
        <Link
          href="/register"
          className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
        >
          Create your school
        </Link>
      </p>
    </div>
  );
}
