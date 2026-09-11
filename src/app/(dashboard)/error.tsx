"use client";

import { RouteError } from "@/shared/components/ui/route-error";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="We couldn't load this workspace"
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
    />
  );
}
