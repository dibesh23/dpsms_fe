"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { promotionApi } from "../api/promotionApi";
import { ArrowLeftIcon, ArrowUpRightIcon } from "@/shared/components/ui/icons";
import type { StudentPromotionHistory } from "../types";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const message = (err as { response?: { data?: { error?: { message?: string } } } }).response
      ?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

function outcomeBadge(outcome: StudentPromotionHistory["outcome"]) {
  switch (outcome) {
    case "PROMOTED":
    case "REPEATER":
      return (
        <StatusBadge status={outcome === "PROMOTED" ? "Promoted" : "Repeater"} variant="success" />
      );
    case "FAILED":
    case "WITHDRAWN":
      return (
        <StatusBadge status={outcome === "FAILED" ? "Failed" : "Withdrawn"} variant="danger" />
      );
    case "HELD":
      return <StatusBadge status="Held" variant="warning" />;
    default:
      return <StatusBadge status={outcome} />;
  }
}

export function StudentPromotionHistoryPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId;

  const [promotions, setPromotions] = useState<StudentPromotionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await promotionApi.getStudentPromotionHistory(studentId);
      setPromotions(res.promotions);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load this student's promotion history."));
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <Link
        href="/promotion/history"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to promotion history
      </Link>

      <PageHeader
        title="Student Promotion History"
        description="Academic-year transitions for this student."
        actions={
          <span className="rounded-md border border-neutral-200 bg-bg-subtle px-2.5 py-1 text-xs text-neutral-500">
            ID: {studentId}
          </span>
        }
      />

      {loading ? (
        <LoadingState label="Loading history…" />
      ) : loadError ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Could not load history" description={loadError} />
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            title="No promotion records"
            description="This student has no recorded transitions yet."
          />
        </div>
      ) : (
        <section className="rounded-lg border border-neutral-200 bg-bg-default">
          <header className="border-b border-neutral-100 px-5 py-4">
            <h2 className="font-medium text-neutral-900">Transitions</h2>
            <p className="text-xs text-neutral-400">{promotions.length} record(s)</p>
          </header>
          <ul className="divide-y divide-neutral-100">
            {promotions.map((p) => (
              <li key={p.promotionRecordId} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">
                      {p.sourceAcademicYear.label} → {p.targetAcademicYear.label}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {p.reviewed && p.reviewedAt
                        ? `Reviewed ${formatDate(p.reviewedAt)}`
                        : p.reviewed
                          ? "Reviewed"
                          : "Not reviewed"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">{outcomeBadge(p.outcome)}</div>
                </div>
                {p.reviewReason && (
                  <p
                    className={cn(
                      "mt-2 rounded-md bg-bg-subtle px-3 py-2 text-sm text-neutral-600",
                    )}
                  >
                    {p.reviewReason}
                  </p>
                )}
                <div className="mt-2">
                  <Link
                    href={`/promotion/history/${p.promotionBatchId}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                  >
                    View batch
                    <ArrowUpRightIcon className="size-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
