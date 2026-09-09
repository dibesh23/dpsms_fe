"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { Pagination } from "@/shared/components/ui/pagination";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { academicApi, type ClassRecord } from "@/features/academic/api/academicApi";
import { promotionApi } from "../api/promotionApi";
import { ArrowUpRightIcon, ClipboardCheckIcon, PencilIcon } from "@/shared/components/ui/icons";
import type { PromotionRecordRow, ReviewDecision } from "../types";

type ReviewFilter = "all" | "pending" | "reviewed";

const DECISION_OPTIONS: { value: ReviewDecision; label: string; description: string }[] = [
  {
    value: "REPEATER",
    label: "Repeat class",
    description: "Enroll the student in the same class next year.",
  },
  {
    value: "PROMOTE_OVERRIDE",
    label: "Promote anyway (override)",
    description: "Promote despite failing. Choose a target class.",
  },
  {
    value: "HELD",
    label: "Hold (no placement)",
    description: "Keep the record on hold; no new enrollment is created.",
  },
  {
    value: "WITHDRAWN",
    label: "Withdraw",
    description: "Mark the student as withdrawn for the next year.",
  },
];

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const message = (err as { response?: { data?: { error?: { message?: string } } } }).response
      ?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

function outcomeVariant(outcome: string): "success" | "danger" | "warning" | "neutral" {
  switch (outcome) {
    case "PROMOTED":
    case "REPEATER":
      return "success";
    case "FAILED":
    case "WITHDRAWN":
      return "danger";
    case "HELD":
      return "warning";
    default:
      return "neutral";
  }
}

export function ReviewFailedPage() {
  const toast = useToast();
  const { can } = useAuth();
  const canReview = can(PERMISSIONS.PROMOTION_REVIEW);

  const [records, setRecords] = useState<PromotionRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<PromotionRecordRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await promotionApi.listPromotions({
        outcome: "FAILED",
        pageSize: 500,
      });
      setRecords(res.items);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load failed promotion records."));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const table = useTable<PromotionRecordRow>({
    data: records,
    pageSize: 8,
    getSearchText: (r) => `${r.studentName} ${r.admissionNumber}`,
    filterMatch: (row, value) => {
      if (value === "pending") return !row.reviewed;
      if (value === "reviewed") return row.reviewed;
      return true;
    },
    sortValue: (row, key) => String(row[key as keyof PromotionRecordRow] ?? ""),
    defaultSortKey: "studentName",
  });

  const columns: Column<PromotionRecordRow>[] = [
    {
      key: "studentName",
      header: "Student",
      sortValue: (r) => r.studentName,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{r.studentName}</p>
          <p className="truncate text-xs text-neutral-400">{r.admissionNumber}</p>
        </div>
      ),
    },
    {
      key: "years",
      header: "Academic Year",
      render: (r) => (
        <span className="text-neutral-500">
          {r.sourceAcademicYear.label} → {r.targetAcademicYear.label}
        </span>
      ),
    },
    {
      key: "outcome",
      header: "Record",
      sortValue: (r) => r.outcome,
      render: (r) => (
        <StatusBadge
          status={r.outcome === "FAILED" ? "Failed" : r.outcome}
          variant={outcomeVariant(r.outcome)}
        />
      ),
    },
    {
      key: "reviewed",
      header: "Review Status",
      sortValue: (r) => (r.reviewed ? 1 : 0),
      render: (r) =>
        r.reviewed ? (
          <div className="text-sm text-emerald-600">
            Reviewed{r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ""}
          </div>
        ) : (
          <StatusBadge status="Pending" variant="warning" />
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        canReview && !r.reviewed ? (
          <Button
            variant="secondary"
            text="Review"
            icon={<PencilIcon className="size-3.5" />}
            className="w-auto px-2.5 py-1 text-xs"
            onClick={() => setReviewTarget(r)}
          />
        ) : (
          <span className="text-xs text-neutral-300">—</span>
        ),
    },
  ];

  const handleReviewed = (record: PromotionRecordRow) => {
    setRecords((current) =>
      current.map((r) =>
        r.promotionRecordId === record.promotionRecordId
          ? { ...r, reviewed: true, reviewedAt: new Date().toISOString() }
          : r,
      ),
    );
    setReviewTarget(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Review Failed Students"
        description="Make a decision for students who did not meet the promotion criteria."
        actions={
          <Link
            href="/promotion/batch"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-bg-default px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-bg-muted"
          >
            <ArrowUpRightIcon className="size-4" />
            Run batch
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by review status"
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending review" },
            { value: "reviewed", label: "Reviewed" },
          ]}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search failed students…"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading failed records…" />
      ) : loadError ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            icon={<ClipboardCheckIcon className="size-5" />}
            title="Could not load records"
            description={loadError}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={table.pageRows}
          keyExtractor={(r) => r.promotionRecordId}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.handleSort}
          empty={{
            title: "No failed promotion records",
            description: "When a batch flags students that need review, they appear here.",
            action: (
              <Link
                href="/promotion/batch"
                className="mt-2 inline-flex rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white"
              >
                Run a batch promotion
              </Link>
            ),
          }}
          footer={
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
              label="students"
            />
          }
        />
      )}

      {canReview && reviewTarget && !reviewTarget.reviewed && (
        <ReviewDialog
          record={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onReviewed={handleReviewed}
          toast={toast}
        />
      )}
    </div>
  );
}

function ReviewDialog({
  record,
  onClose,
  onReviewed,
  toast,
}: {
  record: PromotionRecordRow;
  onClose: () => void;
  onReviewed: (record: PromotionRecordRow) => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [decision, setDecision] = useState<ReviewDecision>("REPEATER");
  const [newClassId, setNewClassId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (decision !== "PROMOTE_OVERRIDE") return;
    let cancelled = false;
    void academicApi
      .listClasses(record.targetAcademicYear.id)
      .then((list) => {
        if (!cancelled) {
          setClasses(list);
          setNewClassId((current) => current || list[0]?.id || "");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load target classes.");
      });
    return () => {
      cancelled = true;
    };
  }, [decision, record.targetAcademicYear.id]);

  const handleSubmit = async () => {
    if (decision === "PROMOTE_OVERRIDE" && !newClassId) {
      setError("Select a target class for the override.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await promotionApi.review(record.promotionRecordId, {
        decision,
        reviewReason: reason.trim() ? reason.trim() : undefined,
        ...(decision === "PROMOTE_OVERRIDE" ? { newClassId } : {}),
      });
      toast.success(
        `${record.studentName} was marked as ${DECISION_OPTIONS.find((d) => d.value === decision)?.label}.`,
      );
      onReviewed(record);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit the review. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Review: ${record.studentName}`}
      description={`${record.sourceAcademicYear.label} → ${record.targetAcademicYear.label}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-neutral-200 bg-bg-subtle px-3 py-2 text-sm text-neutral-600">
          <span className="font-medium text-neutral-800">{record.studentName}</span> (
          {record.admissionNumber}) did not meet the promotion criteria and needs a decision.
        </div>

        <Field label="Decision" required>
          <div className="grid grid-cols-1 gap-2">
            {DECISION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
                  decision === option.value
                    ? "border-neutral-500 bg-bg-subtle"
                    : "border-neutral-200 hover:bg-bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="decision"
                  value={option.value}
                  checked={decision === option.value}
                  onChange={() => setDecision(option.value)}
                  className="mt-0.5 size-4 accent-neutral-900"
                />
                <span>
                  <span className="block text-sm font-medium text-neutral-800">{option.label}</span>
                  <span className="block text-xs text-neutral-500">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>

        <div className="min-h-[4.5rem]">
          {decision === "PROMOTE_OVERRIDE" && (
            <Field label="Target class" required>
              <Select value={newClassId} onChange={(e) => setNewClassId(e.target.value)}>
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <Field label="Review note" hint="Optional. Stored with the audit log for this decision.">
          <Input
            type="text"
            placeholder="e.g. Approved on appeal; strong formative performance."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button
            variant="secondary"
            text="Cancel"
            className="w-auto"
            onClick={onClose}
            disabled={submitting}
          />
          <Button
            text={submitting ? "Submitting…" : "Submit Decision"}
            loading={submitting}
            disabled={submitting}
            className="w-auto"
            onClick={() => void handleSubmit()}
          />
        </div>
      </div>
    </Dialog>
  );
}
