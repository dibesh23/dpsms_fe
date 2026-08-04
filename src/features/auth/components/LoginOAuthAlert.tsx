"use client";

import { useSearchParams } from "next/navigation";

export function LoginOAuthAlert() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("oauth_error");

  if (!oauthError) return null;

  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg"
    >
      <p className="text-sm text-amber-800">{oauthError}</p>
    </div>
  );
}
