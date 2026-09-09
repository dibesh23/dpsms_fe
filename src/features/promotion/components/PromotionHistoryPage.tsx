"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { promotionApi } from "../api/promotionApi";
import {
  ArrowUpRightIcon,
  GraduationCapIcon,
} from "@/shared/components/ui/icons";
import type { PromotionBatchRow } from "../types";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const message = (err as { response?: { data?: { error?: { message?: string } } } }).response
      ?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

export function PromotionHistoryPage() {
  const { can } = useAuth();
  const canRun = can(PERMISSIONS.PROMOTION_BATCH_RUN);

  const [batches, setBatches] = useState<PromotionBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await promotionApi.listPromotionBatches({ pageSize: 500 });
      setBatches(res.items);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load promotion history."));
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const table = useTable<PromotionBatchRow>({
    data: batches,
    pageSize: 8,
    getSearchText: (b) => `${b.sourceAcademicYear.label} ${b.targetAcademicYear.label}`,
    sortValue: (b, key) => String(b[key as keyof PromotionBatchRow] ?? ""),
    defaultSortKey: "completedAt",
    defaultSortDir: "desc",
  });

  const columns: Column<PromotionBatchRow>[] = [
    {
      key: "years",
      header: "Academic Years",
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">
            {b.sourceAcademicYear.label} → {b.targetAcademicYear.label}
          </p>
          <p className="text-xs text-neutral-400">
            Completed {b.completedAt ? formatDate(b.completedAt) : "-"}
          </p>
        </div>
      ),
    },
    {
      key: "totalStudents",
      header: "Total",
      sortValue: (b) => b.totalStudents,
      render: (b) => <span className="font-medium text-neutral-800">{b.totalStudents}</span>,
    },
    {
      key: "totalPromoted",
      header: "Promoted",
      sortValue: (b) => b.totalPromoted,
      render: (b) => <span className="font-medium text-emerald-600">{b.totalPromoted}</span>,
    },
    {
      key: "failedCount",
      header: "Failed",
      sortValue: (b) => b.summary.failed,
      render: (b) => (
        <span className={cn("font-medium", b.summary.failed > 0 ? "text-red-600" : "text-neutral-500")}>
          {b.summary.failed}
        </span>
      ),
    },
    {
      key: "pendingReview",
      header: "Pending Review",
      sortValue: (b) => b.summary.pendingReview,
      render: (b) =>
        b.summary.pendingReview > 0 ? (
          <StatusBadge status="Pending" variant="warning" />
        ) : (
          <StatusBadge status="Complete" variant="success" />
        ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (b) => b.status,
      render: (b) => <StatusBadge status={b.status === "COMPLETED" ? "Completed" : b.status} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (b) => (
        <Link
          href={`/promotion/history/${b.batchId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
        >
          Details
          <ArrowUpRightIcon className="size-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Promotion History"
        description="Completed batch promotions across academic years."
        actions={
          canRun ? (
            <Link
              href="/promotion/batch"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              <GraduationCapIcon className="size-4" />
              Run batch
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search batches…" />
      </div>

      {loading ? (
        <LoadingState label="Loading promotion history…" />
      ) : loadError ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Could not load history" description={loadError} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={table.pageRows}
          keyExtractor={(b) => b.batchId}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.handleSort}
          empty={{
            title: "No promotion batches yet",
            description: "Run your first batch promotion to see history here.",
            action: canRun ? (
              <Link
                href="/promotion/batch"
                className="mt-2 inline-flex rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white"
              >
                Run a batch promotion
              </Link>
            ) : undefined,
          }}
          footer={
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
              label="batches"
            />
          }
        />
      )}
    </div>
  );
}
