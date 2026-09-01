"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { promotionApi } from "../api/promotionApi";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  GraduationCapIcon,
} from "@/shared/components/ui/icons";
import type { BatchDetail, BatchFailedStudent } from "../types";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const message = (err as { response?: { data?: { error?: { message?: string } } } }).response
      ?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

function outcomeBadge(outcome: BatchFailedStudent["outcome"]) {
  if (!outcome) return <StatusBadge status="Pending" variant="warning" />;
  switch (outcome) {
    case "REPEATER":
      return <StatusBadge status="Repeater" variant="success" />;
    case "PROMOTED":
      return <StatusBadge status="Promoted" variant="success" />;
    case "HELD":
      return <StatusBadge status="Held" variant="warning" />;
    case "WITHDRAWN":
      return <StatusBadge status="Withdrawn" variant="danger" />;
    case "FAILED":
      return <StatusBadge status="Failed" variant="danger" />;
    default:
      return <StatusBadge status={outcome} />;
  }
}

const DETAIL_COLUMNS: Column<BatchFailedStudent>[] = [
  {
    key: "studentName",
    header: "Student",
    sortValue: (s) => s.studentName,
    render: (s) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-neutral-900">{s.studentName}</p>
        <p className="truncate text-xs text-neutral-400">{s.admissionNumber}</p>
      </div>
    ),
  },
  {
    key: "currentClass",
    header: "Current Class",
    sortValue: (s) => s.currentClass,
    render: (s) => (
      <span className="text-neutral-500">
        {s.currentClass} · {s.currentSection}
      </span>
    ),
  },
  {
    key: "reviewStatus",
    header: "Review Status",
    sortValue: (s) => (s.reviewed ? 1 : 0),
    render: (s) =>
      s.reviewed ? (
        <div className="text-sm text-emerald-600">
          {outcomeBadge(s.outcome)}
          {s.reviewedAt && (
            <span className="ml-1 text-xs text-neutral-400">{formatDate(s.reviewedAt)}</span>
          )}
        </div>
      ) : (
        <StatusBadge status="Pending" variant="warning" />
      ),
  },
  {
    key: "history",
    header: "",
    align: "right",
    render: (s) => (
      <Link
        href={`/promotion/student/${s.studentId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
      >
        History
        <ArrowUpRightIcon className="size-3.5" />
      </Link>
    ),
  },
];

export function BatchDetailPage() {
  const router = useRouter();
  const params = useParams<{ batchId: string }>();
  const batchId = params?.batchId;
  const { can } = useAuth();
  const canReview = can(PERMISSIONS.PROMOTION_REVIEW);

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await promotionApi.getBatchDetails(batchId);
      setBatch(detail);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load this promotion batch."));
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/promotion/history"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to history
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Promotion batch not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!batch) {
    return <LoadingState label="Loading batch…" />;
  }

  return (
    <div className="space-y-4">
      <Link
        href="/promotion/history"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to history
      </Link>

      <PageHeader
        title="Batch Promotion"
        description={`${batch.sourceAcademicYear.label} → ${batch.targetAcademicYear.label}`}
        actions={
          canReview && batch.summary.pendingReview > 0 ? (
            <Link
              href="/promotion/review"
              className="inline-flex items-center rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Review failed
            </Link>
          ) : undefined
        }
      />

      <section className="rounded-lg border border-neutral-200 bg-bg-default p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-600">
            <GraduationCapIcon className="size-5" />
          </span>
          <div>
            <h2 className="font-medium text-neutral-900">
              {batch.sourceAcademicYear.label} → {batch.targetAcademicYear.label}
            </h2>
            <p className="text-xs text-neutral-400">
              {batch.completedAt ? `Completed ${formatDate(batch.completedAt)}` : batch.status}
            </p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={batch.status === "COMPLETED" ? "Completed" : batch.status} />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-neutral-400">Total students</dt>
            <dd className="mt-0.5 text-xl font-semibold text-neutral-900">{batch.totalStudents}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Promoted</dt>
            <dd className="mt-0.5 text-xl font-semibold text-emerald-600">{batch.totalPromoted}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Failed</dt>
            <dd className="mt-0.5 text-xl font-semibold text-red-600">{batch.summary.failed}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Pending review</dt>
            <dd className={cn("mt-0.5 text-xl font-semibold", batch.summary.pendingReview > 0 ? "text-amber-600" : "text-neutral-900")}>
              {batch.summary.pendingReview}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-medium text-neutral-900">Failed students</h2>
          <p className="text-xs text-neutral-400">
            {batch.failedStudents.length} records requiring administrative decisions.
          </p>
        </header>
        {batch.failedStudents.length === 0 ? (
          <EmptyState
            title="No failed students"
            description="All students in this batch were promoted."
          />
        ) : (
          <DataTable
            columns={DETAIL_COLUMNS}
            data={batch.failedStudents}
            keyExtractor={(s) => s.promotionRecordId}
            sortKey={null}
            sortDir="asc"
            onSort={() => {}}
            empty={{ title: "No failed students" }}
          />
        )}
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          text="Back to history"
          className="w-auto"
          onClick={() => router.push("/promotion/history")}
        />
      </div>
    </div>
  );
}
