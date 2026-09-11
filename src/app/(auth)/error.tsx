"use client";

import { RouteError } from "@/shared/components/ui/route-error";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="We couldn't open this form" />;
}
