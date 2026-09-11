"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { cn } from "@/shared/lib/cn";
import { financeApi, type FinanceClassRow, type FinanceSummary } from "../api/financeApi";
import { type InvoiceStatus } from "../api/feeApi";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  GraduationCapIcon,
  SearchIcon,
} from "@/shared/components/ui/icons";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

const STATUS_VARIANT: Record<InvoiceStatus, StatusVariant> = {
  DRAFT: "neutral",
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
};

export function FinanceOverviewPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const trimmed = searchInput.trim();
    const id = setTimeout(
      () => setSearch(trimmed.length < 2 ? "" : trimmed),
      trimmed.length < 2 ? 0 : 300,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeApi.getSummary(search || undefined);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const searching = search.length >= 2;
  const hits = summary?.search ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Finance"
        description={
          summary?.academicYearLabel
            ? `Academic year ${summary.academicYearLabel}`
            : "All academic years"
        }
      />

      {loading ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
          Loading…
        </div>
      ) : !summary ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            icon={<AlertTriangleIcon className="size-5" />}
            title="Could not load finance data"
            description="Refresh the page to try again."
          />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Collected this term"
              value={formatCurrency(summary.summary.collectedThisTerm)}
              icon={<CreditCardIcon className="size-4" />}
            />
            <StatsCard
              label="Outstanding"
              value={formatCurrency(summary.summary.outstanding)}
              icon={<AlertTriangleIcon className="size-4" />}
            />
            <StatsCard
              label="Overdue invoices"
              value={String(summary.summary.overdueCount)}
              icon={<ClockIcon className="size-4" />}
            />
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                {searching ? "Search results" : "Fee setup checklist"}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {searching
                  ? `${hits.length} student${hits.length === 1 ? "" : "s"} matching “${search}”`
                  : "Set up structures, installments, and invoices for each class."}
              </p>
            </div>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by name, admission no., roll no…"
              className="w-full sm:w-72"
            />
          </section>

          {searching ? (
            hits.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-bg-default">
                <EmptyState
                  icon={<SearchIcon className="size-5" />}
                  title="No students found"
                  description="Try a different name, admission number, or roll number."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {hits.map((hit) => (
                  <div
                    key={hit.studentId}
                    className="rounded-lg border border-neutral-200 bg-bg-default p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">{hit.fullName}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          Adm {hit.admissionNumber} · Roll {hit.rollNumber || "—"} ·{" "}
                          {[hit.className, hit.sectionName].filter(Boolean).join(" / ") ||
                            "Not enrolled"}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {hit.invoices.length} invoice{hit.invoices.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {hit.invoices.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
                        {hit.invoices.map((inv) => (
                          <li
                            key={inv.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <Link
                              href={`/fees/invoices/${inv.id}`}
                              className="group inline-flex min-w-0 max-w-[60%] items-center gap-2 font-medium text-neutral-800"
                            >
                              <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
                              <span className="truncate group-hover:underline">
                                {inv.installmentLabel}
                              </span>
                            </Link>
                            <span className="flex items-center gap-3">
                              <span className="text-xs text-neutral-400">
                                {formatDate(inv.dueDate)}
                              </span>
                              <span className="w-20 text-right text-neutral-700">
                                {formatCurrency(inv.amount)}
                              </span>
                              <StatusBadge
                                status={STATUS_LABEL[inv.status]}
                                variant={STATUS_VARIANT[inv.status]}
                              />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : summary.classes.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default">
              <EmptyState
                icon={<GraduationCapIcon className="size-5" />}
                title="No classes found"
                description="Create classes first, then set up fee structures for each year."
              />
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {summary.classes.map((row) => {
                const complete =
                  row.structureCount > 0 && row.installmentCount > 0 && row.invoiceCount > 0;
                return (
                  <li
                    key={row.classId}
                    className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-bg-default p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">{row.className}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {row.sections.length ? row.sections.join(", ") : "No sections"} ·{" "}
                          {row.students} students
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          complete ? "text-emerald-600" : "text-neutral-400",
                        )}
                      >
                        {complete ? "Fully set up" : "In progress"}
                      </span>
                    </div>
                    <SetupSteps row={row} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function SetupSteps({ row }: { row: FinanceClassRow }) {
  const primaryHref =
    row.structures[0]?.id != null ? `/fees/structures/${row.structures[0].id}` : "/fees/structures";
  const steps = [
    {
      label: "Fee Structure",
      done: row.structureCount > 0,
      count: row.structureCount,
      href: "/fees/structures",
    },
    {
      label: "Installments",
      done: row.installmentCount > 0,
      count: row.installmentCount,
      href: primaryHref,
    },
    {
      label: "Invoices",
      done: row.invoiceCount > 0,
      count: row.invoiceCount,
      href: primaryHref,
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
      {steps.map((step) => (
        <Link
          key={step.label}
          href={step.href}
          aria-disabled={step.done}
          tabIndex={step.done ? -1 : 0}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-colors",
            step.done
              ? "cursor-default border-emerald-100 bg-emerald-50/60"
              : "border-neutral-200 bg-bg-default hover:border-neutral-300 hover:shadow-sm",
          )}
        >
          {step.done ? (
            <CheckCircle2Icon className="size-4 text-emerald-600" />
          ) : (
            <span className="size-4 rounded-full border-[1.5px] border-neutral-300" />
          )}
          <span className="text-xs font-medium text-neutral-900">{step.label}</span>
          <span className={cn("text-[11px]", step.done ? "text-emerald-600" : "text-blue-600")}>
            {step.done ? `${step.count} set up` : "Set up"}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default FinanceOverviewPage;
