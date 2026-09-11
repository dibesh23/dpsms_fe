"use client";

import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "./icons";

function getPageWindow(page: number, pageCount: number): Array<number | "…"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const candidates = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...candidates]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let previous = 0;
  for (const value of sorted) {
    if (value - previous > 1) out.push("…");
    out.push(value);
    previous = value;
  }
  return out;
}

function PageButton({
  onClick,
  disabled,
  children,
  active,
  ariaLabel,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "type-button type-numeric flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-subtle",
        active
          ? "bg-brand-default font-medium text-white shadow-sm"
          : "text-content-subtle hover:bg-brand-subtle hover:text-brand-default",
        disabled &&
          "cursor-not-allowed text-neutral-300 hover:bg-transparent hover:text-neutral-300",
      )}
    >
      {children}
    </button>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  label = "items",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3">
      <p className="type-caption type-numeric">
        Showing <span className="font-medium text-brand-default">{from}</span>–
        <span className="font-medium text-brand-default">{to}</span> of{" "}
        <span className="font-medium text-brand-default">{total}</span> {label}
      </p>
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(1)} disabled={page <= 1} ariaLabel="First page">
          <ChevronsLeftIcon className="size-4" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          ariaLabel="Previous page"
        >
          <ChevronLeftIcon className="size-4" />
        </PageButton>
        {getPageWindow(page, pageCount).map((value, index) =>
          value === "…" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-neutral-400">
              …
            </span>
          ) : (
            <PageButton
              key={value}
              onClick={() => onPageChange(value)}
              active={value === page}
              ariaLabel={`Page ${value}`}
            >
              {value}
            </PageButton>
          ),
        )}
        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          ariaLabel="Next page"
        >
          <ChevronRightIcon className="size-4" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
          ariaLabel="Last page"
        >
          <ChevronsRightIcon className="size-4" />
        </PageButton>
      </div>
    </div>
  );
}
