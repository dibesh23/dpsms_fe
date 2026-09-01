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
import { AlertTriangleIcon, CheckCircle2Icon, GraduationCapIcon } from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { cn } from "@/shared/lib/cn";
import { academicApi, type SessionRecord } from "@/features/academic/api/academicApi";
import { promotionApi, type RunBatchPayload } from "../api/promotionApi";
import type { RunBatchResponse } from "../types";

type Step = "configure" | "confirm" | "success";

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
      <span className={cn("text-neutral-500", s.marks !== undefined && s.marks < 40 && "text-red-600")}>
        {s.marks !== undefined ? `${s.marks}%` : "—"}
      </span>
    ),
  },
  {
    key: "attendance",
    header: "Attendance",
    sortValue: (s) => s.attendance ?? -1,
    render: (s) => (
      <span className="text-neutral-500">{s.attendance !== undefined ? `${s.attendance}%` : "—"}</span>
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

  const handleRun = useCallback(async () => {
    if (!configValid) return;
    setRunning(true);
    setApiError(null);
    try {
      const payload: RunBatchPayload = {
        academicYearFromId: sourceYearId,
        academicYearToId: targetYearId,
        marksThreshold,
        attendanceThreshold,
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
  }, [configValid, sourceYearId, targetYearId, marksThreshold, attendanceThreshold, toast]);

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
        description="Promote all students from one academic year to the next."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-bg-subtle px-3 py-1 text-xs font-medium text-neutral-500">
            Step {step === "configure" ? 1 : step === "confirm" ? 2 : 3} of 3
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
              <Select
                value={sourceYearId}
                onChange={(e) => setSourceYearId(e.target.value)}
              >
                <option value="">Select source year…</option>
                {sourceSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Target academic year" required>
              <Select
                value={targetYearId}
                onChange={(e) => setTargetYearId(e.target.value)}
              >
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
            Students are promoted to the next grade in the target year. If any promoted student has no
            matching class/section in the target year, the batch will fail and no changes are made.
          </p>

          {apiError && (
            <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button
              variant="secondary"
              text="Cancel"
              className="w-auto"
              onClick={() => setStep("configure")}
            />
            <Button
              text="Continue"
              disabled={!configValid}
              className="w-auto"
              onClick={() => {
                setApiError(null);
                setStep("confirm");
              }}
            />
          </div>
        </section>
      )}

      {step === "confirm" && selectedSource && selectedTarget && (
        <section className="rounded-lg border border-neutral-200 bg-bg-default p-5">
          <h2 className="font-medium text-neutral-900">Confirm batch promotion</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Review the configuration below before running the promotion.
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-neutral-400">Source academic year</dt>
              <dd className="mt-0.5 font-medium text-neutral-800">{selectedSource.label}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">Target academic year</dt>
              <dd className="mt-0.5 font-medium text-neutral-800">{selectedTarget.label}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">Marks threshold</dt>
              <dd className="mt-0.5 font-medium text-neutral-800">{marksThreshold}%</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">Attendance threshold</dt>
              <dd className="mt-0.5 font-medium text-neutral-800">{attendanceThreshold}%</dd>
            </div>
          </dl>

          {apiError && (
            <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-neutral-100 pt-4">
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
            <Button
              text={running ? "Running…" : "Run Promotion"}
              loading={running}
              disabled={running}
              className="w-auto"
              onClick={() => void handleRun()}
            />
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
            <dl className="mt-4 grid grid-cols-4 gap-4 border-t border-emerald-200 pt-4">
              <div>
                <dt className="text-xs text-emerald-600">Total</dt>
                <dd className="mt-0.5 text-2xl font-semibold text-emerald-900">
                  {result.summary.total}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-emerald-600">Promoted</dt>
                <dd className="mt-0.5 text-2xl font-semibold text-emerald-900">
                  {result.summary.promoted}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-emerald-600">Need review</dt>
                <dd className="mt-0.5 text-2xl font-semibold text-red-600">
                  {result.summary.failed}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-emerald-600">Skipped</dt>
                <dd className="mt-0.5 text-2xl font-semibold text-neutral-500">
                  {result.summary.skipped ?? 0}
                </dd>
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
                  <StatusBadge status={s.isActive ? "Active" : "Upcoming"} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
