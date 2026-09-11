"use client";

import Link from "next/link";
import { AlertTriangleIcon, ArrowUpRightIcon } from "./icons";

export function RouteError({
  error,
  reset,
  title = "We couldn't load this page",
  homeHref = "/",
  homeLabel = "Back to home",
}: {
  error?: Error & { digest?: string };
  reset: () => void;
  title?: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <main className="flex min-h-[60dvh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg rounded-[24px] border border-neutral-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangleIcon className="size-6" />
        </span>
        <h1 className="type-section-title mt-5">{title}</h1>
        <p className="type-body-secondary mx-auto mt-2 max-w-sm">
          Something interrupted the request. Try again; your existing data has not been changed.
        </p>
        {error?.digest && <p className="type-caption mt-3">Reference: {error.digest}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="type-button inline-flex h-11 items-center justify-center rounded-xl bg-brand-default px-5 font-semibold text-white transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-default"
          >
            Try again
          </button>
          <Link
            href={homeHref}
            className="type-button inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-300 px-5 font-semibold text-neutral-700 transition hover:border-brand-default hover:text-brand-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-default"
          >
            {homeLabel} <ArrowUpRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
