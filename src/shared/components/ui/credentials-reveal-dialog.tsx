"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangleIcon, CheckIcon, CopyIcon } from "@/shared/components/ui/icons";

interface CredentialsRevealDialogProps {
  open: boolean;
  personName: string;
  identifierLabel?: string;
  identifierValue?: string;
  credentials: { email: string; password: string };
  personType?: string;
  slipTitle?: string;
  slipFooter?: string;
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

export function CredentialsRevealDialog({
  open,
  personName,
  identifierLabel,
  identifierValue,
  credentials,
  personType = "Student",
  slipTitle,
  slipFooter,
  onAcknowledged,
}: CredentialsRevealDialogProps) {
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
        <h2 className="print-credential-slip__title">
          {slipTitle ?? `${personType} Login Credentials`}
        </h2>
        <div className="print-credential-slip__body">
          <div className="print-credential-slip__row">
            <span className="print-credential-slip__label">Name</span>
            <span className="print-credential-slip__value">{personName}</span>
          </div>
          {identifierLabel && identifierValue && (
            <div className="print-credential-slip__row">
              <span className="print-credential-slip__label">{identifierLabel}</span>
              <span className="print-credential-slip__value">{identifierValue}</span>
            </div>
          )}
          <div className="print-credential-slip__row">
            <span className="print-credential-slip__label">Email</span>
            <span className="print-credential-slip__value">{credentials.email}</span>
          </div>
          <div className="print-credential-slip__row">
            <span className="print-credential-slip__label">Password</span>
            <span className="print-credential-slip__value print-credential-slip__value--password">
              {credentials.password}
            </span>
          </div>
        </div>
        <p className="print-credential-slip__footer">
          {slipFooter ??
            "Please keep this credential safe. Do not share it with anyone other than the recipient."}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <div className="fixed inset-0 bg-neutral-900/40 animate-overlay-in" aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${personType} credentials`}
          className="relative my-8 w-full max-w-lg rounded-lg border border-neutral-200 bg-bg-default shadow-xl animate-scale-in"
        >
          <div className="flex items-start gap-4 border-b border-neutral-100 px-5 py-4">
            <div className="flex size-9 flex-none items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangleIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="type-modal-title">{personType} credentials created</h2>
              <p className="type-body-secondary mt-0.5">
                Copy these now — the password won&apos;t be shown again.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Save this now — this password won&apos;t be shown again.
            </div>

            <div className="space-y-1.5">
              <p className="type-label text-xs text-neutral-500">{personType}</p>
              <p className="type-body text-neutral-900">
                {personName}
                {identifierLabel && identifierValue && (
                  <>
                    {" "}
                    <span className="text-neutral-400">·</span>{" "}
                    <span className="text-neutral-500">
                      {identifierLabel}: {identifierValue}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="type-label text-xs text-neutral-500">Email</p>
                <CopyButton value={credentials.email} label="email" />
              </div>
              <div className="select-all rounded-md border border-neutral-200 bg-bg-subtle px-3 py-2 font-mono text-sm text-neutral-900">
                {credentials.email}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="type-label text-xs text-neutral-500">Password</p>
                <CopyButton value={credentials.password} label="password" />
              </div>
              <div className="select-all rounded-md border border-neutral-200 bg-bg-subtle px-3 py-2 font-mono text-sm text-neutral-900">
                {credentials.password}
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
