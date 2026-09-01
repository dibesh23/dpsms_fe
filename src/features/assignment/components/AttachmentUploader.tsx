"use client";

import { useRef, useState } from "react";
import { DownloadIcon, FileTextIcon, PlusIcon, TrashIcon } from "@/shared/components/ui/icons";
import { formatBytes } from "./labels";

export interface DisplayAttachment {
  id: string;
  label: string;
  sizeBytes: number;
}

/**
 * Reusable multi-file attach/remove UI following the notice-attachment pattern:
 * existing attachments are shown as chips (with optional open/remove), and new
 * files are held locally until `onSaveNew` uploads them. Combines both into a
 * single list so a parent can call `onSaveNew(file)` then merge the result.
 */
export function AttachmentUploader({
  existing,
  onSubmit,
  submitLabel = "Add file",
  onOpen,
  onRemove,
  maxFiles = 5,
  readOnly = false,
}: {
  existing: DisplayAttachment[];
  onSubmit: (files: File[]) => Promise<void>;
  submitLabel?: string;
  onOpen?: (attachment: DisplayAttachment) => void;
  onRemove?: (attachment: DisplayAttachment) => void;
  maxFiles?: number;
  readOnly?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const totalAttachments = existing.length + newFiles.length;

  const handleUpload = async () => {
    if (newFiles.length === 0 || saving) return;
    setSaving(true);
    try {
      await onSubmit(newFiles);
      setNewFiles([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {totalAttachments === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 bg-bg-subtle px-3 py-3 text-sm text-neutral-400">
          No files attached yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {existing.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs"
            >
              <FileTextIcon className="size-3.5 flex-none text-neutral-400" />
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => onOpen(a)}
                  className="max-w-[140px] truncate font-medium text-neutral-700 hover:underline"
                >
                  {a.label}
                </button>
              ) : (
                <span className="max-w-[140px] truncate font-medium text-neutral-700">
                  {a.label}
                </span>
              )}
              <span className="text-neutral-400">{formatBytes(a.sizeBytes)}</span>
              {onOpen && (
                <button
                  type="button"
                  onClick={() => onOpen(a)}
                  aria-label="Open"
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  <DownloadIcon className="size-3.5" />
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(a)}
                  aria-label="Remove"
                  className="text-neutral-400 hover:text-red-500"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {newFiles.map((file, i) => (
            <div
              key={`new-${i}`}
              className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs"
            >
              <FileTextIcon className="size-3.5 flex-none text-blue-400" />
              <span className="max-w-[120px] truncate font-medium text-blue-700">{file.name}</span>
              <span className="text-blue-400">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => setNewFiles((prev) => prev.filter((f) => f !== file))}
                className="text-blue-400 hover:text-red-500"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!readOnly && totalAttachments < maxFiles && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700"
          >
            <PlusIcon className="size-3.5" />
            Choose file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) setNewFiles((prev) => [...prev, ...files]);
              e.target.value = "";
            }}
          />
          {newFiles.length > 0 && (
            <ButtonStub
              label={saving ? "Uploading…" : "Upload"}
              onClick={() => void handleUpload()}
              disabled={saving}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ButtonStub({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-auto rounded-md bg-neutral-900 px-3 text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
