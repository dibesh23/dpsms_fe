"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { feeApi } from "../api/feeApi";

const POLL_INTERVAL_MS = 4_000;
const MAX_ATTEMPTS = 10;

interface Options {
  onReceiptReady: (paymentId: string, receiptUrl: string) => void;
}

export function useReceiptPolling({ onReceiptReady }: Options) {
  const [pollingPaymentId, setPollingPaymentId] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const onReceiptReadyRef = useRef(onReceiptReady);

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
    } catch {}
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      stop();
    }
  }, [pollingPaymentId, stop]);

  useEffect(() => {
    if (!pollingPaymentId) return;
    attemptsRef.current = 0;
    const initialId = setTimeout(() => void poll(), 0);
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initialId);
      clearInterval(id);
    };
  }, [pollingPaymentId, poll]);

  const startPolling = useCallback((paymentId: string) => {
    attemptsRef.current = 0;
    setPollingPaymentId(paymentId);
  }, []);

  return { pollingPaymentId, startPolling };
}
