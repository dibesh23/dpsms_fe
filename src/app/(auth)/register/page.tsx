import React from "react";
import Link from "next/link";
import { RegisterForm } from "../../../features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="type-page-title text-center">Create your school</h1>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <p className="type-body-secondary mt-6 text-center font-medium">
        Already registered your school?{" "}
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
