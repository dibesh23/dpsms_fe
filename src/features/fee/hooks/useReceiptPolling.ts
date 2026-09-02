"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { feeApi } from "../api/feeApi";

const POLL_INTERVAL_MS = 4_000; // receipts are generated async; poll every 4 s
const MAX_ATTEMPTS = 10;

interface Options {
  /** Called once a receipt's attachment becomes available */
  onReceiptReady: (paymentId: string, receiptUrl: string) => void;
}

/**
 * Polls a single payment's receipt after it has been recorded. Receipts are
 * generated in the background queue, so a freshly-recorded payment has no
 * attachment yet — this hook checks until it appears or the attempt cap is hit.
 */
export function useReceiptPolling({ onReceiptReady }: Options) {
  const [pollingPaymentId, setPollingPaymentId] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const onReceiptReadyRef = useRef(onReceiptReady);

  // Keep the latest callback without restarting the interval
  useEffect(() => {
    onReceiptReadyRef.current = onReceiptReady;
  }, [onReceiptReady]);

  const stop = useCallback(() => setPollingPaymentId(null), []);

  const poll = useCallback(async () => {
    const paymentId = pollingPaymentId;
    if (!paymentId) return;
    attemptsRef.current += 1;
    try {
      const receipt = await feeApi.getReceipt(paymentId);
      if (receipt.attachmentUrl) {
        onReceiptReadyRef.current(paymentId, receipt.attachmentUrl);
        stop();
        return;
      }
    } catch {
      // 404 — receipt still pending in the queue. Keep polling.
    }
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      stop();
    }
  }, [pollingPaymentId, stop]);

  useEffect(() => {
    if (!pollingPaymentId) return;
    attemptsRef.current = 0;
    void poll();
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // poll() restarts whenever the target changes; deliberate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingPaymentId]);

  /** Start polling for a payment's receipt; stops any previous target */
  const startPolling = useCallback((paymentId: string) => {
    attemptsRef.current = 0;
    setPollingPaymentId(paymentId);
  }, []);

  return { pollingPaymentId, startPolling };
}