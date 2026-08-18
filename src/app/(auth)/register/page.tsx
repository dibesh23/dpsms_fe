import React from "react";
import Link from "next/link";
import { RegisterForm } from "../../../features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h3 className="text-center text-xl font-semibold">
        Create your school
      </h3>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm font-medium text-neutral-500">
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