"use client";

import { RouteError } from "@/shared/components/ui/route-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-default text-content-default antialiased">
        <RouteError error={error} reset={reset} title="Digital Pathshala needs a moment" />
      </body>
    </html>
  );
}
