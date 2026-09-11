"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { Dialog } from "@/shared/components/ui/dialog";
import { Field, Select } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { academicApi } from "@/features/academic/api/academicApi";
import {
  reportApi,
  REPORT_TYPE_LABELS,
  REPORT_FORMAT_LABELS,
  REPORT_STATUS_LABELS,
  type ReportRequestRecord,
  type ReportType,
  type ReportFormat,
} from "../api/reportApi";
import {
  PlusIcon,
  DownloadIcon,
  FileTextIcon,
  CreditCardIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
} from "@/shared/components/ui/icons";
import { ReportPreviewDialog } from "./ReportPreviewDialog";

const STATUS_VARIANT: Record<
  ReportRequestRecord["status"],
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  QUEUED: "info",
  RUNNING: "warning",
  PROCESSING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
};

const TYPE_FILTERS = (Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((t) => ({
  value: t,
  label: REPORT_TYPE_LABELS[t],
}));

const ACTIVE_STATUSES: ReportRequestRecord["status"][] = ["QUEUED", "RUNNING", "PROCESSING"];

const TYPE_ICONS: Record<ReportType, typeof FileTextIcon> = {
  FEE: CreditCardIcon,
  ATTENDANCE: ClipboardCheckIcon,
  EXAM: GraduationCapIcon,
};

const TYPE_HINTS: Record<ReportType, string> = {
  FEE: "Fee collection and dues",
  ATTENDANCE: "Student attendance summary",
  EXAM: "Published exam results",
};

const ALL = "";

function RequestForm({
  onRequest,
  onClose,
  canRequestFee,
}: {
  onRequest: (values: {
    type: ReportType;
    format: ReportFormat;
    parameters: Record<string, string>;
  }) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
  canRequestFee: boolean;
}) {
  const [type, setType] = useState<ReportType>("FEE");
  const [format, setFormat] = useState<ReportFormat>("PDF");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [academicYearId, setAcademicYearId] = useState<string>(ALL);
  const [classId, setClassId] = useState<string>(ALL);
  const [sectionId, setSectionId] = useState<string>(ALL);
  const [studentId, setStudentId] = useState<string>(ALL);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reportTypes = useMemo(
    () =>
      (Object.keys(REPORT_TYPE_LABELS) as ReportType[]).filter((t) => canRequestFee || t !== "FEE"),
    [canRequestFee],
  );

  useEffect(() => {
    if (!reportTypes.includes(type)) setType(reportTypes[0] ?? "FEE");
  }, [reportTypes, type]);

  useEffect(() => {
    setFormat("PDF");
  }, [type]);

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<
    { id: string; fullName: string; admissionNumber: string }[]
  >([]);
  const [sessions, setSessions] = useState<{ id: string; label: string }[]>([]);

  const loadedScopeRef = useRef(false);
  useEffect(() => {
    if (loadedScopeRef.current) return;
    loadedScopeRef.current = true;
    void academicApi
      .listClasses()
      .then((c) => setClasses(c.map((c) => ({ id: c.id, name: c.name }))));
    void academicApi
      .listSessions()
      .then((s) => setSessions(s.map((s) => ({ id: s.id, label: s.label }))));
  }, []);

  useEffect(() => {
    setSectionId(ALL);
    setStudentId(ALL);
    setStudents([]);
    if (!classId) {
      setSections([]);
      return;
    }
    void academicApi
      .listSections(classId)
      .then((s) => setSections(s.map((s) => ({ id: s.id, name: s.name }))));
  }, [classId]);

  useEffect(() => {
    setStudentId(ALL);
    setStudents([]);
    if (!classId) return;
    void academicApi.listClassStudents(classId).then((rows) => {
      const filtered = sectionId === ALL ? rows : rows.filter((r) => r.sectionId === sectionId);
      setStudents(
        filtered.map((r) => ({
          id: r.studentId,
          fullName: r.fullName,
          admissionNumber: r.admissionNumber,
        })),
      );
    });
  }, [classId, sectionId]);

  const onSubmit = async () => {
    setApiError(null);
    setSubmitting(true);
    try {
      const parameters: Record<string, string> = {};
      if (academicYearId) parameters.academicYearId = academicYearId;
      if (classId) parameters.classId = classId;
      if (sectionId) parameters.sectionId = sectionId;
      if (studentId) parameters.studentId = studentId;
      if (fromDate) parameters.fromDate = fromDate;
      if (toDate) parameters.toDate = toDate;
      const result = await onRequest({ type, format, parameters });
      if (!result.success) {
        setApiError(result.error ?? "Could not create report request.");
        setSubmitting(false);
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const ShowScope = type === "FEE" || type === "ATTENDANCE" || type === "EXAM";

  return (
    <div className="space-y-6">
      <div>
        <p className="type-micro-label mb-2">Report type</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {reportTypes.map((t) => {
            const Icon = TYPE_ICONS[t];
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors",
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-bg-default text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                )}
              >
                <Icon className="size-4" />
                <span className="text-xs font-medium">{REPORT_TYPE_LABELS[t]}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">{TYPE_HINTS[type]}</p>
      </div>

      <div>
        <p className="type-micro-label mb-2">Format</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(REPORT_FORMAT_LABELS) as ReportFormat[]).map((f) => {
            const active = format === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-bg-default text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                )}
              >
                <span>{REPORT_FORMAT_LABELS[f]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {ShowScope && (
        <div className="min-h-[18rem]">
          <p className="type-micro-label mb-2">
            Scope <span className="font-normal normal-case">(optional)</span>
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {type === "FEE" && (
                <Field label="Academic year">
                  <Select
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                  >
                    <option value={ALL}>Active year</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Class">
                <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value={ALL}>All classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {classId && (
                <Field label="Section">
                  <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                    <option value={ALL}>All sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {(classId || sectionId) && (
                <Field label="Student">
                  <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                    <option value={ALL}>All students</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.admissionNumber})
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
            {type === "ATTENDANCE" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="From date">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </Field>
                <Field label="To date">
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}

      {apiError && (
        <div role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {apiError}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button
          variant="secondary"
          text="Cancel"
          onClick={onClose}
          className="w-auto"
          type="button"
        />
        <Button
          text={submitting ? "Requesting…" : "Request Report"}
          loading={submitting}
          onClick={onSubmit}
          className="w-auto"
        />
      </div>
    </div>
  );
}

export function ReportGeneratorPage() {
  const [requests, setRequests] = useState<ReportRequestRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<ReportRequestRecord | null>(null);
  const toast = useToast();
  const { user } = useAuth();
  const canRequestFee = user?.role === "SUPER_ADMIN" || user?.role === "PRINCIPAL";
  const pollTimer = useRef<number | null>(null);

  const load = useCallback(async (p = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await reportApi.list({ page: p, pageSize: 20 });
      setRequests(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch {
      setRequests([]);
      setTotal(0);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, false);
  }, [load]);

  const hasActive = useMemo(
    () => requests.some((r) => ACTIVE_STATUSES.includes(r.status)),
    [requests],
  );

  useEffect(() => {
    if (!hasActive) return;
    pollTimer.current = window.setInterval(() => {
      void load(1, true);
    }, 3000);
    return () => {
      if (pollTimer.current !== null) window.clearInterval(pollTimer.current);
    };
  }, [hasActive, load]);

  const handleRequest = async (values: {
    type: ReportType;
    format: ReportFormat;
    parameters: Record<string, string>;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      await reportApi.request(values);
      await load(1, false);
      toast.success("Report requested. It will be ready shortly.");
      return { success: true };
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      return { success: false, error: axiosData ?? "Could not request report." };
    }
  };

  const handlePreview = useCallback((report: ReportRequestRecord) => {
    setPreviewReport(report);
  }, []);

  const table = useTable<ReportRequestRecord>({
    data: requests,
    pageSize: 20,
    getSearchText: (r) => `${REPORT_TYPE_LABELS[r.type]} ${REPORT_STATUS_LABELS[r.status]}`,
    filterMatch: (r, value) => r.type === value,
    sortValue: (r, key) => (key === "type" ? r.type : key === "status" ? r.status : r.createdAt),
    defaultSortKey: "createdAt",
    defaultSortDir: "desc",
  });

  const columns: Column<ReportRequestRecord>[] = useMemo(
    () => [
      {
        key: "type",
        header: "Report",
        sortValue: (r) => r.type,
        render: (r) => {
          const Icon = TYPE_ICONS[r.type];
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-7 flex-none items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-500">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">{REPORT_TYPE_LABELS[r.type]}</p>
                <p className="text-xs text-neutral-400">{REPORT_FORMAT_LABELS[r.format]}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: "requestedBy",
        header: "Requested by",
        sortValue: (r) => r.requestedBy.fullName,
        render: (r) => <span className="text-neutral-700">{r.requestedBy.fullName}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => r.status,
        render: (r) => (
          <StatusBadge status={REPORT_STATUS_LABELS[r.status]} variant={STATUS_VARIANT[r.status]} />
        ),
      },
      {
        key: "createdAt",
        header: "Requested at",
        sortValue: (r) => r.createdAt,
        render: (r) => (
          <span className="text-neutral-600">{new Date(r.createdAt).toLocaleString()}</span>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (r) =>
          r.status === "COMPLETED" ? (
            <Button
              text="Preview"
              icon={<DownloadIcon className="size-4" />}
              variant="outline"
              className="w-auto"
              onClick={() => handlePreview(r)}
            />
          ) : r.status === "FAILED" ? (
            <span className="text-xs text-red-600" title={r.error ?? ""}>
              Failed
            </span>
          ) : null,
      },
    ],
    [handlePreview],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Generate and download fee, attendance, and exam reports"
        actions={
          <Button
            text="New Report"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {total} report request{total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-3">
          <FilterDropdown
            label="Filter by type"
            options={TYPE_FILTERS}
            value={table.filter}
            onChange={table.setFilter}
          />
          <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search reports…" />
          <button
            type="button"
            onClick={() => void load(1, false)}
            aria-label="Refresh reports"
            className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-bg-default px-3 text-sm text-neutral-700 transition-colors hover:bg-bg-muted"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
          Loading…
        </div>
      ) : table.rows.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            icon={<FileTextIcon className="size-5" />}
            title="No reports yet"
            description="Request your first report to get started."
            action={
              <Button
                text="New Report"
                icon={<PlusIcon className="size-4" />}
                className="w-auto"
                onClick={() => setDialogOpen(true)}
              />
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={table.pageRows}
          keyExtractor={(r) => r.id}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.handleSort}
          empty={{ title: "No results" }}
          footer={
            <Pagination
              page={page}
              pageSize={table.pageSize}
              total={total}
              onPageChange={(p) => void load(p)}
              label="reports"
            />
          }
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Request Report"
        description="Choose a type, format, and optional scope."
        maxWidth="max-w-xl"
      >
        <RequestForm
          onRequest={handleRequest}
          onClose={() => setDialogOpen(false)}
          canRequestFee={canRequestFee}
        />
      </Dialog>

      <ReportPreviewDialog report={previewReport} onClose={() => setPreviewReport(null)} />
    </div>
  );
}

export default ReportGeneratorPage;
