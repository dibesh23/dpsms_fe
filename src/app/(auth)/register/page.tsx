import React from "react";
import Link from "next/link";
import { RegisterForm } from "../../../features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-6xl py-8 sm:px-4 lg:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="type-badge inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold tracking-wide text-brand-default uppercase">
          New school workspace
        </span>
        <h1 className="type-display mt-4 text-center sm:text-4xl">Build your Digital Pathshala</h1>
        <p className="type-body-reading mx-auto mt-3 max-w-xl text-content-subtle">
          Set up your school identity and principal account. Your workspace will be ready with
          role-based access from the first sign-in.
        </p>
      </div>

      <div className="mt-8 sm:mt-10">
        <RegisterForm />
      </div>

      <p className="type-body-secondary mt-7 text-center font-medium">
        Already registered your school?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-default transition-colors hover:text-brand-hover hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
