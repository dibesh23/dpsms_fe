"use client";

import { cn } from "@/shared/lib/cn";
import { Wordmark } from "@/shared/components/ui/wordmark";
import { useAuth } from "@/features/auth/hooks/useAuth";
import Link from "next/link";

export function TopBar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-bg-default/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" aria-label="Digital Pathshala dashboard">
          <Wordmark className="h-6" />
        </Link>

        <nav className="flex items-center gap-2">
          {!isLoading && user && (
            <>
              <span className="hidden text-sm text-neutral-500 sm:block">
                {user.fullName}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className={cn(
                  "h-9 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700",
                  "transition-colors hover:bg-neutral-50",
                )}
              >
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}