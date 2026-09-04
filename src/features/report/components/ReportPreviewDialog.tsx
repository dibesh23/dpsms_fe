"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/components/ui/toast";
import { DownloadIcon, FileTextIcon } from "@/shared/components/ui/icons";
import {
  reportApi,
  REPORT_TYPE_LABELS,
  REPORT_FORMAT_LABELS,
  type ReportPreview,
  type ReportRequestRecord,
} from "../api/reportApi";

function formatCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

export function ReportPreviewDialog({
  report,
  onClose,
}: {
  report: ReportRequestRecord | null;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!report) {
      setPreview(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreview(null);
    reportApi
      .preview(report.id)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message;
        if (!cancelled) setError(message ?? "Could not load report preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [report]);

  const handleDownload = async () => {
    if (!report) return;
    try {
      await reportApi.download(report.id);
      toast.success("Report downloaded.");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
      toast.error(message ?? "Could not download report.");
    }
  };

  return (
    <Dialog
      open={report !== null}
      onClose={onClose}
      title="Report Preview"
      description={
        preview
          ? `${REPORT_TYPE_LABELS[preview.detail.type]} · ${REPORT_FORMAT_LABELS[preview.detail.format]}`
          : "Loading preview…"
      }
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="py-14 text-center text-sm text-neutral-400">Loading preview…</div>
      ) : error ? (
        <div className="py-8 text-center">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            You can still download the file directly.
          </p>
        </div>
      ) : preview ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-neutral-900">{preview.title}</h3>
              {preview.subtitle && (
                <p className="mt-0.5 text-xs text-neutral-500">{preview.subtitle}</p>
              )}
            </div>
            {preview.rows.length > 0 && (
              <span className="flex-none rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs text-neutral-500">
                {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-neutral-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-neutral-50">
                <tr>
                  {(preview.columns ?? []).map((col) => (
                    <th
                      key={col.key}
                      className="border-b border-neutral-200 px-3 py-2 text-xs font-semibold whitespace-nowrap text-neutral-500"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(preview.columns ?? []).length || 1}
                      className="px-3 py-10 text-center text-sm text-neutral-400"
                    >
                      No rows in this report.
                    </td>
                  </tr>
                ) : (
                  preview.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-neutral-100 last:border-0">
                      {(preview.columns ?? []).map((col) => (
                        <td
                          key={col.key}
                          className="px-3 py-2 whitespace-nowrap text-neutral-700"
                        >
                          {formatCell(row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button
              variant="secondary"
              text="Close"
              onClick={onClose}
              className="w-auto"
              type="button"
            />
            <Button
              text="Download File"
              icon={<DownloadIcon className="size-4" />}
              onClick={() => void handleDownload()}
              className="w-auto"
              type="button"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10">
          <FileTextIcon className="size-6 text-neutral-300" />
          <p className="text-sm text-neutral-400">No preview available.</p>
        </div>
      )}
    </Dialog>
  );
}