"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <main aria-busy="true" aria-label="Completing sign in…">
      <p>Completing sign in…</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main aria-busy="true" aria-label="Completing sign in…">
          <p>Completing sign in…</p>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
