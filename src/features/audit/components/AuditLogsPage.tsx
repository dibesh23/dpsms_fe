"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { DownloadIcon, ShieldIcon } from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import {
  auditApi,
  type AuditLogFilters,
  type AuditLogRecord,
  type AuditSeverity,
  type AuditStatus,
} from "../api/auditApi";

const PAGE_SIZE = 20;
const CATEGORIES = [
  "AUTHENTICATION",
  "AUTHORIZATION",
  "USER_MANAGEMENT",
  "ACADEMIC",
  "ATTENDANCE",
  "FINANCE",
  "DOCUMENT",
  "CONFIGURATION",
  "AUDIT",
  "SYSTEM",
];

const inputClass =
  "h-9 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100";

function labelize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function severityVariant(value: AuditSeverity): StatusVariant {
  return value === "CRITICAL" ? "danger" : value === "WARNING" ? "warning" : "neutral";
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 border-b border-neutral-100 py-3 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-medium tracking-wide text-neutral-400 uppercase">{label}</dt>
      <dd className="break-all text-sm text-neutral-700">{value || "—"}</dd>
    </div>
  );
}

export function AuditLogsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);
  const [draft, setDraft] = useState<AuditLogFilters>({});
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const canRead = can(PERMISSIONS.AUDIT_LOG_READ);
  const canExport = can(PERMISSIONS.AUDIT_LOG_EXPORT);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const result = await auditApi.list({ ...filters, page, pageSize: PAGE_SIZE });
      setRecords(result.items);
      setTotal(result.total);
    } catch (loadError) {
      setRecords([]);
      setTotal(0);
      if (axios.isAxiosError(loadError) && !loadError.response) {
        setError(
          "The backend is not reachable at localhost:4000. Start the backend server and try again.",
        );
      } else if (axios.isAxiosError(loadError) && loadError.response?.status === 403) {
        setError(
          "Your account does not have permission to read audit logs. Sign in again after permissions are seeded.",
        );
      } else {
        setError("Audit logs could not be loaded. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [canRead, filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== undefined && value !== "").length,
    [filters],
  );

  const applyFilters = () => {
    setPage(1);
    setFilters(draft);
  };

  const clearFilters = () => {
    setDraft({});
    setFilters({});
    setPage(1);
  };

  const exportLogs = async () => {
    setExporting(true);
    try {
      await auditApi.exportCsv(filters);
      toast.success("Audit log export downloaded.");
    } catch {
      toast.error("Audit logs could not be exported.");
    } finally {
      setExporting(false);
    }
  };

  if (!canRead) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-bg-default">
        <EmptyState
          title="Access denied"
          description="You do not have permission to view audit logs."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Logs"
        description="Review security and administrative activity for your school"
        actions={
          canExport ? (
            <Button
              text="Export CSV"
              icon={<DownloadIcon className="size-4" />}
              variant="secondary"
              className="w-auto"
              loading={exporting}
              onClick={() => void exportLogs()}
            />
          ) : undefined
        }
      />

      <section className="rounded-lg border border-neutral-200 bg-bg-default p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-neutral-900">Filter activity</h2>
            <p className="text-xs text-neutral-500">
              Narrow results by event, risk, outcome, or date.
            </p>
          </div>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className={inputClass}
            value={draft.eventType ?? ""}
            onChange={(event) => setDraft((value) => ({ ...value, eventType: event.target.value }))}
            placeholder="Event type (e.g. LOGIN_FAILED)"
            aria-label="Event type"
          />
          <select
            className={inputClass}
            value={draft.category ?? ""}
            onChange={(event) => setDraft((value) => ({ ...value, category: event.target.value }))}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {labelize(category)}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={draft.severity ?? ""}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                severity: event.target.value as AuditSeverity | undefined,
              }))
            }
            aria-label="Severity"
          >
            <option value="">All severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            className={inputClass}
            value={draft.status ?? ""}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                status: event.target.value as AuditStatus | undefined,
              }))
            }
            aria-label="Status"
          >
            <option value="">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            From
            <input
              className={`${inputClass} min-w-0 flex-1`}
              type="date"
              value={draft.from ?? ""}
              onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            To
            <input
              className={`${inputClass} min-w-0 flex-1`}
              type="date"
              value={draft.to?.slice(0, 10) ?? ""}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  to: event.target.value ? `${event.target.value}T23:59:59.999Z` : "",
                }))
              }
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button text="Clear" variant="outline" className="w-auto" onClick={clearFilters} />
          <Button text="Apply filters" className="w-auto" onClick={applyFilters} />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldIcon className="size-4 text-neutral-500" />
            <h2 className="text-sm font-medium text-neutral-900">School activity</h2>
          </div>
          <span className="text-xs text-neutral-500">{total.toLocaleString()} records</span>
        </div>

        {loading ? (
          <LoadingState label="Loading audit logs…" />
        ) : error ? (
          <EmptyState
            title="Unable to load audit logs"
            description={error}
            action={<Button text="Try again" className="w-auto" onClick={() => void load()} />}
          />
        ) : records.length === 0 ? (
          <EmptyState
            title="No audit logs found"
            description="Try changing the filters or date range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs font-medium tracking-wide text-neutral-400">
                <tr>
                  <th className="px-5 py-3">Date & time</th>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="cursor-pointer transition-colors hover:bg-bg-muted"
                    onClick={() => setSelected(record)}
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-neutral-500">
                      {dateTime(record.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-neutral-900">{labelize(record.eventType)}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">{labelize(record.category)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-neutral-700">
                        {record.actorName ?? (record.actorId ? "Unknown user" : "System")}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {record.actorRole ? labelize(record.actorRole) : "Automated"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-600">
                      {record.resourceType
                        ? `${record.resourceType}${record.resourceId ? ` · ${record.resourceId.slice(0, 8)}…` : ""}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        status={labelize(record.severity)}
                        variant={severityVariant(record.severity)}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        status={labelize(record.status)}
                        variant={record.status === "SUCCESS" ? "success" : "danger"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && total > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            label="records"
          />
        )}
      </section>

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Audit event details"
        description={
          selected ? `${labelize(selected.eventType)} · ${dateTime(selected.createdAt)}` : undefined
        }
        maxWidth="max-w-2xl"
      >
        {selected && (
          <>
            <dl>
              <DetailRow label="Actor" value={selected.actorName ?? selected.actorId ?? "System"} />
              <DetailRow
                label="Role"
                value={selected.actorRole ? labelize(selected.actorRole) : "Automated"}
              />
              <DetailRow
                label="Resource"
                value={[selected.resourceType, selected.resourceId].filter(Boolean).join(" / ")}
              />
              <DetailRow label="IP address" value={selected.ipAddress} />
              <DetailRow label="Request ID" value={selected.requestId} />
              <DetailRow label="Error code" value={selected.errorCode} />
              <DetailRow label="User agent" value={selected.userAgent} />
            </dl>
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-medium tracking-wide text-neutral-400 uppercase">
                Metadata
              </h3>
              <pre className="max-h-64 overflow-auto rounded-lg bg-neutral-950 p-4 text-xs leading-5 text-neutral-200">
                {JSON.stringify(selected.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
