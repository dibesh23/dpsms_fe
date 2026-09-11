"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog } from "@/shared/components/ui/dialog";
import { DownloadIcon, FileTextIcon, LoadingSpinner } from "@/shared/components/ui/icons";
import { noticeApi, type NoticeAttachment } from "../api/noticeApi";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function AttachmentPreviewDialog({
  open,
  onClose,
  noticeId,
  attachment,
}: {
  open: boolean;
  onClose: () => void;
  noticeId: string;
  attachment: NoticeAttachment | null;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !attachment) return;

    let cancelled = false;
    const id = setTimeout(() => {
      setObjectUrl(null);
      setMimeType("");
      setLoading(true);
      setError(false);

      noticeApi
        .fetchAttachmentBlob(noticeId, attachment.id)
        .then(({ objectUrl: url, mimeType: mime }) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = url;
          setObjectUrl(url);
          setMimeType(mime);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setLoading(false);
            setError(true);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [open, attachment?.id, noticeId]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleDownload = () => {
    if (!attachment) return;
    noticeApi.openAttachment(noticeId, attachment.id, attachment.label);
  };

  if (!attachment) return null;

  const previewable = objectUrl && (isImage(mimeType) || isPdf(mimeType));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={attachment.label}
      description={formatBytes(attachment.sizeBytes)}
      maxWidth={isImage(mimeType) ? "max-w-2xl" : "max-w-lg"}
    >
      <div className="flex flex-col gap-3">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner className="size-6 text-neutral-400" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 py-12 text-neutral-500">
            <FileTextIcon className="size-8 text-neutral-300" />
            <p className="text-sm">Failed to load preview</p>
            <button
              type="button"
              onClick={handleDownload}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
            >
              <DownloadIcon className="size-3.5" />
              Download instead
            </button>
          </div>
        )}

        {!loading && !error && previewable && isImage(mimeType) && (
          <div className="flex justify-center overflow-auto rounded-md border border-neutral-200 bg-neutral-50">
            <Image
              src={objectUrl}
              alt={attachment.label}
              width={1600}
              height={1200}
              unoptimized
              className="max-h-[60vh] w-auto object-contain"
            />
          </div>
        )}

        {!loading && !error && previewable && isPdf(mimeType) && (
          <div className="overflow-hidden rounded-md border border-neutral-200">
            <iframe src={objectUrl} title={attachment.label} className="h-[60vh] w-full" />
          </div>
        )}

        {!loading && !error && !previewable && (
          <div className="flex flex-col items-center gap-2 py-12 text-neutral-500">
            <FileTextIcon className="size-8 text-neutral-300" />
            <p className="text-sm">Preview not available for this file type</p>
            <p className="text-xs text-neutral-400">{mimeType || "Unknown type"}</p>
          </div>
        )}

        <div className="flex justify-end border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
          >
            <DownloadIcon className="size-3.5" />
            Download
          </button>
        </div>
      </div>
    </Dialog>
  );
}
