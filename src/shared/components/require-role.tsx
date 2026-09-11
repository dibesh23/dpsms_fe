"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { BanIcon } from "@/shared/components/ui/icons";

export const ADMIN_ROLES = ["SUPER_ADMIN", "PRINCIPAL"] as const;
export function RequireRole({
  roles,
  children,
}: {
  roles: readonly string[];
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking access…" />;
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <EmptyState
        icon={<BanIcon className="size-5" />}
        title="You don't have access to this page"
        description="This area is limited to school administrators."
        action={
          <Link
            href="/dashboard"
            className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
