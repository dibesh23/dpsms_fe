"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangleIcon, CheckIcon, CopyIcon } from "@/shared/components/ui/icons";

interface StudentCredentialsDialogProps {
  open: boolean;
  name: string;
  admissionNumber: string;
  email: string;
  password: string;
  onAcknowledged: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  }, [value]);

  return (
    <Button
      type="button"
      variant="outline"
      text={copied ? "Copied" : `Copy ${label}`}
      icon={copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      className="w-auto"
      onClick={handleCopy}
    />
  );
}

export function StudentCredentialsDialog({
  open,
  name,
  admissionNumber,
  email,
  password,
  onAcknowledged,
}: StudentCredentialsDialogProps) {
  useEffect(() => {
    if (!open) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") e.stopPropagation();
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  if (!open) return null;

  const slip = (
    <div className="print-credential-slip hidden">
      <div className="print-credential-slip__card">
        <h2 className="print-credential-slip__title">Student Login Credentials</h2>
        <div className="print-credential-slip__body">
          <div className="print-credential-slip__row">
            <span className="print-credential-slip__label">Student Name</span>
            <span className="print-credential-slip__value">{name}</span>
          </div>
          <div className="print-credential-slip__row">
            <span className="print-credential-slip__label">Admission No.</span>
            <span className="print-credential-slip__value">{admissionNumber}</span>
          </div>
          <div className="print-credential-slip__row">
            <span className="print-credential-slip__label">Email</span>
            <span className="print-credential-slip__value">{email}</span>
          </div>
          <div className="print-credential-slip__row">
            <span className="print-credential-slip__label">Password</span>
            <span className="print-credential-slip__value print-credential-slip__value--password">
              {password}
            </span>
          </div>
        </div>
        <p className="print-credential-slip__footer">
          Please keep this credential safe. Do not share it with anyone other than the
          student/guardian.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <div
          className="fixed inset-0 bg-neutral-900/40 animate-overlay-in"
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Student credentials"
          className="relative my-8 w-full max-w-lg rounded-lg border border-neutral-200 bg-bg-default shadow-xl animate-scale-in"
        >
          <div className="flex items-start gap-4 border-b border-neutral-100 px-5 py-4">
            <div className="flex size-9 flex-none items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangleIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-neutral-900">
                Student credentials created
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                Copy these now — the password won&apos;t be shown again.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Save this now — this password won&apos;t be shown again.
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-neutral-500">Student</p>
              <p className="text-sm text-neutral-900">
                {name} <span className="text-neutral-400">·</span>{" "}
                <span className="text-neutral-500">Adm. {admissionNumber}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-500">Email</p>
                <CopyButton value={email} label="email" />
              </div>
              <div className="select-all rounded-md border border-neutral-200 bg-bg-subtle px-3 py-2 font-mono text-sm text-neutral-900">
                {email}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-500">Password</p>
                <CopyButton value={password} label="password" />
              </div>
              <div className="select-all rounded-md border border-neutral-200 bg-bg-subtle px-3 py-2 font-mono text-sm text-neutral-900">
                {password}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              text="Print credential slip"
              className="w-full"
              onClick={() => window.print()}
            />
          </div>

          <div className="flex items-center justify-end border-t border-neutral-100 px-5 py-4">
            <Button
              type="button"
              text="I've saved this"
              className="w-auto"
              onClick={onAcknowledged}
            />
          </div>
        </div>
      </div>
      {createPortal(slip, document.body)}
    </>
  );
}
