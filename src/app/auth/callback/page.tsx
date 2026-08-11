"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/shared/components/ui/wordmark";
import { LoadingSpinner } from "@/shared/components/ui/icons";

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      router.replace("/");
    } else {
      router.replace("/login?error=oauth_failed");
    }
  }, [params, router]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-white px-4">
      <Wordmark className="h-8" />
      <LoadingSpinner className="h-5 w-5 text-neutral-400" />
      <p className="text-sm font-medium text-neutral-500">
        Completing sign in…
      </p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-white px-4">
          <Wordmark className="h-8" />
          <LoadingSpinner className="h-5 w-5 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-500">
            Completing sign in…
          </p>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}