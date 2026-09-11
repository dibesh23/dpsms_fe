"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Input } from "@/shared/components/ui/input";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { LoadingState } from "@/shared/components/ui/loading-state";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
} from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { cn } from "@/shared/lib/cn";
import { academicApi, type SessionRecord } from "@/features/academic/api/academicApi";
import { promotionApi, type RunBatchPayload } from "../api/promotionApi";
import type { PreviewResult, PreviewStudentRow, RunBatchResponse } from "../types";

type Step = "configure" | "preview" | "success";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const message = (err as { response?: { data?: { error?: { message?: string } } } }).response
      ?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

const FAILED_COLUMNS: Column<RunBatchResponse["failedStudents"][number]>[] = [
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
    key: "marks",
    header: "Marks",
    sortValue: (s) => s.marks ?? -1,
    render: (s) => (
      <span
        className={cn("text-neutral-500", s.marks !== undefined && s.marks < 40 && "text-red-600")}
      >
        {s.marks !== undefined ? `${s.marks}%` : "—"}
      </span>
    ),
  },
  {
    key: "attendance",
    header: "Attendance",
    sortValue: (s) => s.attendance ?? -1,
    render: (s) => (
      <span className="text-neutral-500">
        {s.attendance !== undefined ? `${s.attendance}%` : "—"}
      </span>
    ),
  },
];

export function BatchPromotionPage() {
  const toast = useToast();
  const { can } = useAuth();
  const canRun = can(PERMISSIONS.PROMOTION_BATCH_RUN);

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [step, setStep] = useState<Step>("configure");
  const [sourceYearId, setSourceYearId] = useState<string>("");
  const [targetYearId, setTargetYearId] = useState<string>("");
  const [marksThreshold, setMarksThreshold] = useState<number>(40);
  const [attendanceThreshold, setAttendanceThreshold] = useState<number>(75);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, "PROMOTE" | "HOLD">>({});

  const [running, setRunning] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<RunBatchResponse | null>(null);

  useEffect(() => {
    void academicApi
      .listSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  const sourceSessions = useMemo(
    () => sessions.filter((s) => s.id !== targetYearId),
    [sessions, targetYearId],
  );
  const targetSessions = useMemo(
    () => sessions.filter((s) => s.id !== sourceYearId),
    [sessions, sourceYearId],
  );

  const selectedSource = sessions.find((s) => s.id === sourceYearId);
  const selectedTarget = sessions.find((s) => s.id === targetYearId);
  const configValid = sourceYearId && targetYearId && sourceYearId !== targetYearId;

  const handlePreview = useCallback(async () => {
    if (!configValid) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setOverrides({});
    try {
      const response = await promotionApi.previewBatch({
        academicYearFromId: sourceYearId,
        academicYearToId: targetYearId,
        marksThreshold,
        attendanceThreshold,
      });
      setPreview(response);
      setStep("preview");
    } catch (err) {
      setPreviewError(
        getApiErrorMessage(err, "Could not preview the promotion. Please try again."),
      );
    } finally {
      setPreviewLoading(false);
    }
  }, [configValid, sourceYearId, targetYearId, marksThreshold, attendanceThreshold]);

  const handleRun = useCallback(async () => {
    if (!configValid || !preview) return;
    setRunning(true);
    setApiError(null);
    try {
      const overridesList = Object.entries(overrides).map(([enrollmentId, decision]) => ({
        enrollmentId,
        decision,
      }));
      const payload: RunBatchPayload = {
        academicYearFromId: sourceYearId,
        academicYearToId: targetYearId,
        marksThreshold,
        attendanceThreshold,
        overrides: overridesList,
      };
      const response = await promotionApi.runBatch(payload);
      setResult(response);
      setStep("success");
      toast.success(
        `${response.summary.promoted} of ${response.summary.total} students promoted.${
          (response.summary.skipped ?? 0) > 0
            ? ` ${response.summary.skipped} skipped (class name has no grade).`
            : ""
        }`,
      );
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Could not run the batch promotion. Please try again."));
    } finally {
      setRunning(false);
    }
  }, [
    configValid,
    sourceYearId,
    targetYearId,
    marksThreshold,
    attendanceThreshold,
    overrides,
    preview,
    toast,
  ]);

  const groups = useMemo(() => {
    if (!preview) return [];
    const map = new Map<string, PreviewStudentRow[]>();
    for (const s of preview.students) {
      const list = map.get(s.currentClass) ?? [];
      list.push(s);
      map.set(s.currentClass, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [preview]);

  const effectiveDecision = useCallback(
    (row: PreviewStudentRow): "PROMOTE" | "HOLD" =>
      overrides[row.enrollmentId] ?? row.recommendedOutcome,
    [overrides],
  );

  const overrideCounts = useMemo(() => {
    if (!preview) return { promote: 0, hold: 0 };
    let promote = 0;
    let hold = 0;
    for (const s of preview.students) {
      if (effectiveDecision(s) === "PROMOTE") promote++;
      else hold++;
    }
    return { promote, hold };
  }, [preview, effectiveDecision]);

  const isOverridden = useCallback(
    (row: PreviewStudentRow) =>
      overrides[row.enrollmentId] !== undefined &&
      overrides[row.enrollmentId] !== row.recommendedOutcome,
    [overrides],
  );

  const setOverride = useCallback((row: PreviewStudentRow, value: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (!value) delete next[row.enrollmentId];
      else next[row.enrollmentId] = value as "PROMOTE" | "HOLD";
      return next;
    });
  }, []);

  if (!canRun) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-bg-default p-6 text-sm text-neutral-600">
        You do not have permission to run batch promotions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Batch Promotion"
        description="Review and promote all students from one academic year to the next."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-bg-subtle px-3 py-1 text-xs font-medium text-neutral-500">
            Step {step === "configure" ? 1 : step === "preview" ? 2 : 3} of 3
          </span>
        }
      />

      {step === "configure" && (
        <section className="rounded-lg border border-neutral-200 bg-bg-default p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-600">
              <GraduationCapIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-medium text-neutral-900">Configure promotion</h2>
              <p className="text-xs text-neutral-400">
                Choose the source and target academic years and the pass thresholds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Source academic year" required>
              <Select value={sourceYearId} onChange={(e) => setSourceYearId(e.target.value)}>
                <option value="">Select source year…</option>
                {sourceSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Target academic year" required>
              <Select value={targetYearId} onChange={(e) => setTargetYearId(e.target.value)}>
                <option value="">Select target year…</option>
                {targetSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Marks threshold (%)"
              hint="Students with exam marks below this are flagged for review."
            >
              <Input
                type="number"
                min={0}
                max={100}
                value={marksThreshold}
                onChange={(e) => setMarksThreshold(Number(e.target.value))}
              />
            </Field>

            <Field
              label="Attendance threshold (%)"
              hint="Used when no exam marks are available for a student."
            >
              <Input
                type="number"
                min={0}
                max={100}
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
              />
            </Field>
          </div>

          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Students are promoted to the next grade in the target year. Any missing next-grade class
            is created automatically. You can review each student and override the decision before
            running.
          </p>

          {previewError && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {previewError}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button
              text={previewLoading ? "Previewing…" : "Preview results"}
              loading={previewLoading}
              disabled={!configValid || previewLoading}
              className="w-auto"
              onClick={() => void handlePreview()}
            />
          </div>
        </section>
      )}

      {step === "preview" && preview && selectedSource && selectedTarget && (
        <section className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-600">
                  <GraduationCapIcon className="size-5" />
                </span>
                <div>
                  <h2 className="font-medium text-neutral-900">Review &amp; preview</h2>
                  <p className="text-xs text-neutral-400">
                    {selectedSource.label} → {selectedTarget.label} · marks ≥ {marksThreshold}% ·
                    attendance ≥ {attendanceThreshold}%
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                text="Reset overrides"
                className="w-auto"
                onClick={() => setOverrides({})}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-neutral-400">Total students</dt>
                <dd className="type-kpi mt-0.5">{preview.summary.total}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Promote</dt>
                <dd className="type-kpi mt-0.5 text-emerald-600">{overrideCounts.promote}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Hold for review</dt>
                <dd className="type-kpi mt-0.5 text-amber-600">{overrideCounts.hold}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Not placeable (skipped)</dt>
                <dd className="type-kpi mt-0.5 text-neutral-500">{preview.summary.skipped}</dd>
              </div>
            </dl>
          </div>

          {apiError && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {apiError}
            </div>
          )}

          <section className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div>
                <h2 className="font-medium text-neutral-900">Students</h2>
                <p className="text-xs text-neutral-400">
                  Grouped by current class. Override the system recommendation where needed.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" /> Promote
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" /> Hold for review
                </span>
              </div>
            </header>

            {groups.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-neutral-500">
                No enrolled students found.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {groups.map(([className, rows]) => (
                  <div key={className}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-5 py-2.5">
                      <span className="text-sm font-semibold text-neutral-800">{className}</span>
                      <span className="text-xs text-neutral-400">{rows.length} students</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
                          <th className="px-5 py-2 font-medium">Student</th>
                          <th className="px-3 py-2 font-medium">Marks</th>
                          <th className="px-3 py-2 font-medium">Attendance</th>
                          <th className="px-3 py-2 font-medium">Target</th>
                          <th className="px-3 py-2 font-medium">System</th>
                          <th className="px-5 py-2 text-right font-medium">Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {rows.map((row) => {
                          const decision = effectiveDecision(row);
                          const overridden = isOverridden(row);
                          const cannotPromote =
                            row.targetClass === null && row.recommendedOutcome === "PROMOTE";
                          return (
                            <tr
                              key={row.enrollmentId}
                              className={cn("bg-white", overridden && "bg-amber-50/60")}
                            >
                              <td className="px-5 py-3">
                                <p className="font-medium text-neutral-900">{row.studentName}</p>
                                <p className="text-xs text-neutral-400">{row.admissionNumber}</p>
                              </td>
                              <td className="px-3 py-3 text-neutral-500">
                                {row.marks !== undefined ? `${row.marks}%` : "—"}
                              </td>
                              <td className="px-3 py-3 text-neutral-500">
                                {row.attendance !== undefined ? `${row.attendance}%` : "—"}
                              </td>
                              <td className="px-3 py-3">
                                {row.targetClass ? (
                                  <span className="text-neutral-600">
                                    {row.targetClass}
                                    {row.targetSection ? ` · ${row.targetSection}` : ""}
                                  </span>
                                ) : (
                                  <span className="text-xs text-neutral-400">
                                    {row.recommendedOutcome === "HOLD"
                                      ? "Held for review"
                                      : "No grade in class name"}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {row.recommendedOutcome === "PROMOTE" ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    Promote
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                    <span className="size-2 rounded-full bg-amber-500" />
                                    Hold
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <Select
                                  value={row.recommendedOutcome === decision ? "" : decision}
                                  onChange={(e) => setOverride(row, e.target.value)}
                                  disabled={cannotPromote}
                                  className="w-40"
                                >
                                  <option value="">System</option>
                                  <option value="PROMOTE">Force promote</option>
                                  <option value="HOLD">Force hold</option>
                                </Select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              text="Back"
              className="w-auto"
              disabled={running}
              onClick={() => {
                setApiError(null);
                setStep("configure");
              }}
            />
            <div className="flex items-center gap-3">
              <p className="text-sm text-neutral-500">
                {Object.keys(overrides).filter((k) => overrides[k]).length > 0
                  ? `${Object.keys(overrides).filter((k) => overrides[k]).length} override(s) will be applied`
                  : "No overrides — system recommendations will be applied"}
              </p>
              <Button
                text={running ? "Running…" : "Run Promotion"}
                loading={running}
                disabled={running}
                className="w-auto"
                onClick={() => void handleRun()}
              />
            </div>
          </div>
        </section>
      )}

      {step === "success" && result && (
        <section className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2Icon className="size-6 flex-none text-emerald-600" />
              <div>
                <h2 className="font-medium text-emerald-900">Batch promotion completed</h2>
                <p className="mt-0.5 text-sm text-emerald-700">
                  {selectedSource?.label} → {selectedTarget?.label} completed on{" "}
                  {new Date(result.completedAt).toLocaleString()}.
                </p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-emerald-200 pt-4">
              <div>
                <dt className="text-xs text-emerald-600">Total</dt>
                <dd className="type-kpi mt-0.5 text-emerald-900">{result.summary.total}</dd>
              </div>
              <div>
                <dt className="text-xs text-emerald-600">Promoted</dt>
                <dd className="type-kpi mt-0.5 text-emerald-900">{result.summary.promoted}</dd>
              </div>
              <div>
                <dt className="text-xs text-emerald-600">Need review</dt>
                <dd className="type-kpi mt-0.5 text-red-600">{result.summary.failed}</dd>
              </div>
            </dl>
          </div>

          <section className="rounded-lg border border-neutral-200 bg-bg-default">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 font-medium text-neutral-900">
                  Failed students
                  {result.summary.failed > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <AlertTriangleIcon className="size-4" />
                    </span>
                  )}
                </h2>
                <p className="text-xs text-neutral-400">
                  These students need an administrative decision before the next academic year.
                </p>
              </div>
              {result.summary.failed > 0 && (
                <Link
                  href="/promotion/review"
                  className="inline-flex items-center rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                >
                  Review failed students
                </Link>
              )}
            </header>
            {result.failedStudents.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-neutral-500">
                No students failed. Everyone was promoted.
              </div>
            ) : (
              <DataTable
                columns={FAILED_COLUMNS}
                data={result.failedStudents}
                keyExtractor={(s) => s.studentId}
                sortKey={null}
                sortDir="asc"
                onSort={() => {}}
              />
            )}
          </section>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              text="Run another batch"
              icon={<GraduationCapIcon className="size-4" />}
              className="w-auto"
              onClick={() => {
                setResult(null);
                setPreview(null);
                setOverrides({});
                setApiError(null);
                setStep("configure");
              }}
            />
            <Link
              href="/promotion/history"
              className="inline-flex items-center rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              View history
            </Link>
          </div>
        </section>
      )}

      {step === "configure" && (
        <section className="rounded-lg border border-neutral-200 bg-bg-default">
          <header className="border-b border-neutral-100 px-5 py-4">
            <h2 className="font-medium text-neutral-900">Available academic years</h2>
            <p className="text-xs text-neutral-400">Pick the current and next terms for a batch.</p>
          </header>
          {sessions.length === 0 ? (
            <LoadingState label="Loading academic years…" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex-none text-sm font-medium text-neutral-800">{s.label}</span>
                  <StatusBadge status={s.isActive ? "Active" : "Inactive"} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
