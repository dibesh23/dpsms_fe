"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/features/auth/api/authApi";
import { CheckCircle2Icon, MailIcon } from "@/shared/components/ui/icons";
import { LoadingState } from "@/shared/components/ui/loading-state";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerificationState>(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    let active = true;

    void authApi
      .verifyEmail(token)
      .then(() => {
        if (active) setState("success");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/90 px-6 py-12 shadow-[0_18px_50px_rgba(6,78,59,.08)] backdrop-blur">
        <LoadingState label="Verifying your email…" />
      </div>
    );
  }

  const success = state === "success";

  return (
    <div
      className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/90 px-7 py-9 text-center shadow-[0_18px_50px_rgba(6,78,59,.08)] backdrop-blur"
      aria-live="polite"
    >
      <span
        className={`mx-auto flex size-12 items-center justify-center rounded-2xl ${
          success ? "bg-emerald-50 text-brand-default" : "bg-amber-50 text-amber-700"
        }`}
      >
        {success ? <CheckCircle2Icon className="size-6" /> : <MailIcon className="size-6" />}
      </span>
      <h1 className="type-page-title mt-5">
        {success ? "Email verified" : "Verification link unavailable"}
      </h1>
      <p className="type-body-secondary mt-2">
        {success
          ? "Your email address has been confirmed. You can now continue to your account."
          : "This link is invalid, expired, or has already been used. Sign in to request a new verification email."}
      </p>
      <Link
        href="/login"
        className="type-button mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-default px-5 font-semibold text-white shadow-[0_10px_24px_rgba(6,78,59,.16)] transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-default"
      >
        Continue to login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState label="Opening verification link…" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
