"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Field, Select } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { Breadcrumbs } from "@/shared/components/ui/breadcrumbs";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useReceiptPolling } from "../hooks/useReceiptPolling";
import { PERMISSIONS } from "@/shared/permissions";
import {
  feeApi,
  type InvoiceDetailRecord,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentRecordResult,
  type StudentFeeSummaryRecord,
  PAYMENT_METHODS,
  SCHOLARSHIP_TYPES,
  type ScholarshipType,
} from "../api/feeApi";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import {
  AlertTriangleIcon,
  CreditCardIcon,
  FileTextIcon,
} from "@/shared/components/ui/icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

const STATUS_VARIANT: Record<InvoiceStatus, StatusVariant> = {
  DRAFT: "neutral",
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK: "Bank Transfer",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

// ── Payment Form ───────────────────────────────────

const PaymentSchema = z.object({
  amountPaid: z.number().int().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "BANK", "CHEQUE", "OTHER"]),
  paidAt: z.string().optional(),
});
type PaymentValues = z.infer<typeof PaymentSchema>;

function RecordPaymentForm({
  outstanding,
  onPay,
  onClose,
}: {
  outstanding: number;
  onPay: (values: PaymentValues) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentValues>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      amountPaid: outstanding > 0 ? outstanding : 0,
      paymentMethod: "CASH",
      paidAt: new Date().toISOString().slice(0, 16),
    },
  });

  const amountPaid = watch("amountPaid");
  const wouldOverpay = amountPaid > outstanding;

  const onSubmit = async (values: PaymentValues) => {
    setApiError(null);
    const ok = await onPay(values);
    if (!ok) setApiError("Could not record payment. Check the amount.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-600">
        Outstanding amount: <span className="font-medium text-neutral-900">{formatCurrency(outstanding)}</span>
      </div>
      <Field label="Amount" error={errors.amountPaid?.message || (wouldOverpay ? "Amount exceeds outstanding" : undefined)} required>
        <Input
          type="number"
          {...register("amountPaid", { valueAsNumber: true })}
          disabled={isSubmitting}
          className={wouldOverpay ? "border-red-500" : ""}
        />
      </Field>
      <Field label="Payment Method" error={errors.paymentMethod?.message} required>
        <Select {...register("paymentMethod")} disabled={isSubmitting}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Date & Time" hint="Defaults to now">
        <Input type="datetime-local" {...register("paidAt")} disabled={isSubmitting} />
      </Field>
      {apiError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" type="button" />
        <Button
          text={isSubmitting ? "Recording…" : "Record Payment"}
          loading={isSubmitting}
          disabled={wouldOverpay}
          className="w-auto"
        />
      </div>
    </form>
  );
}

// ── Discount Form ──────────────────────────────────

const DiscountSchema = z.object({
  amount: z.number().int().positive("Amount must be positive"),
  reason: z.string().max(255).optional(),
});
type DiscountValues = z.infer<typeof DiscountSchema>;

function DiscountForm({
  enrollmentId,
  feeStructureId,
  onApply,
  onClose,
}: {
  enrollmentId: string;
  feeStructureId: string;
  onApply: (values: DiscountValues & { enrollmentId: string; feeStructureId: string }) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DiscountValues>({
    resolver: zodResolver(DiscountSchema),
    defaultValues: { amount: 0, reason: "" },
  });

  const onSubmit = async (values: DiscountValues) => {
    setApiError(null);
    const ok = await onApply({ ...values, enrollmentId, feeStructureId });
    if (!ok) setApiError("Could not apply discount.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
        Only <span className="font-medium">Principal</span> can apply discounts.
      </div>
      <Field label="Discount Amount" error={errors.amount?.message} required hint="Fixed amount in your currency">
        <Input type="number" {...register("amount", { valueAsNumber: true })} disabled={isSubmitting} />
      </Field>
      <Field label="Reason" hint="Optional">
        <Input {...register("reason")} placeholder="e.g. Sibling discount" disabled={isSubmitting} />
      </Field>
      {apiError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" type="button" />
        <Button text={isSubmitting ? "Applying…" : "Apply Discount"} loading={isSubmitting} className="w-auto" />
      </div>
    </form>
  );
}

// ── Scholarship Form ───────────────────────────────

const ScholarshipFormSchema = z.object({
  percentageOrAmount: z.number().int().positive("Must be positive"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
});
type ScholarshipFormValues = z.infer<typeof ScholarshipFormSchema>;

function ScholarshipFormComponent({
  enrollmentId,
  onApply,
  onClose,
}: {
  enrollmentId: string;
  onApply: (values: ScholarshipFormValues & { enrollmentId: string }) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScholarshipFormValues>({
    resolver: zodResolver(ScholarshipFormSchema),
    defaultValues: { percentageOrAmount: 0, type: "PERCENTAGE" },
  });

  const type = watch("type");

  const onSubmit = async (values: ScholarshipFormValues) => {
    setApiError(null);
    const ok = await onApply({ ...values, enrollmentId });
    if (!ok) setApiError("Could not apply scholarship.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
        Only <span className="font-medium">Principal</span> can apply scholarships.
      </div>
      <Field label="Type" error={errors.type?.message} required>
        <Select {...register("type")} disabled={isSubmitting}>
          {SCHOLARSHIP_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={type === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount"}
        error={errors.percentageOrAmount?.message}
        required
        hint={type === "PERCENTAGE" ? "Capped at 100%" : "Amount in your currency"}
      >
        <Input type="number" {...register("percentageOrAmount", { valueAsNumber: true })} disabled={isSubmitting} />
      </Field>
      {apiError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" type="button" />
        <Button text={isSubmitting ? "Applying…" : "Apply Scholarship"} loading={isSubmitting} className="w-auto" />
      </div>
    </form>
  );
}

// ── Main Detail Page ───────────────────────────────

export function FeeInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;
  const [invoice, setInvoice] = useState<InvoiceDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentFees, setStudentFees] = useState<StudentFeeSummaryRecord | null>(null);
  const [studentFeesLoading, setStudentFeesLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [scholarshipDialogOpen, setScholarshipDialogOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null);
  const [readyReceipts, setReadyReceipts] = useState<Record<string, string>>({});
  const toast = useToast();
  const { user, can } = useAuth();
  const canPay = can(PERMISSIONS.FEE_PAYMENT_RECORD);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isPrincipal = user?.role === "PRINCIPAL";

  const { pollingPaymentId, startPolling } = useReceiptPolling({
    onReceiptReady: (paymentId, receiptUrl) => {
      setReadyReceipts((prev) => ({ ...prev, [paymentId]: receiptUrl }));
      toast.success("Payment receipt is ready.");
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feeApi.getInvoice(invoiceId);
      setInvoice(data);
    } catch {
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Fetch the student's full cross-year fee picture so an admin looking up
  // one student sees every outstanding amount, not just this invoice's year.
  useEffect(() => {
    if (!invoice?.enrollment?.studentId) return;
    let cancelled = false;
    setStudentFeesLoading(true);
    feeApi
      .getStudentFeeSummary(invoice.enrollment.studentId)
      .then((data) => {
        if (!cancelled) setStudentFees(data);
      })
      .catch(() => {
        if (!cancelled) setStudentFees(null);
      })
      .finally(() => {
        if (!cancelled) setStudentFeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoice?.enrollment?.studentId]);

  const handlePayment = async (values: PaymentValues): Promise<boolean> => {
    try {
      const result: PaymentRecordResult = await feeApi.recordPayment(invoiceId, {
        amountPaid: values.amountPaid,
        paymentMethod: values.paymentMethod,
        paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : undefined,
      });
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: result.status,
              paidToDate: result.paidToDate,
              owed: result.due,
              payments: [
                ...(prev.payments ?? []),
                { id: result.payment.id, amountPaid: result.payment.amountPaid, paymentMethod: result.payment.paymentMethod, paidAt: result.payment.paidAt },
              ],
            }
          : prev,
      );
      setPaymentDialogOpen(false);
      toast.success("Payment recorded. Receipt will be generated shortly.");
      // Receipts are generated async — poll until the attachment is ready.
      startPolling(result.payment.id);
      return true;
    } catch {
      return false;
    }
  };

  const handleDiscount = async (
    values: { amount: number; reason?: string } & { enrollmentId: string; feeStructureId: string },
  ): Promise<boolean> => {
    try {
      await feeApi.applyDiscount(values);
      setDiscountDialogOpen(false);
      toast.success("Discount applied.");
      await load();
      return true;
    } catch {
      return false;
    }
  };

  const handleScholarship = async (
    values: { percentageOrAmount: number; type: ScholarshipType } & { enrollmentId: string },
  ): Promise<boolean> => {
    try {
      await feeApi.applyScholarship(values);
      setScholarshipDialogOpen(false);
      toast.success("Scholarship applied.");
      await load();
      return true;
    } catch {
      return false;
    }
  };

  const handleViewReceipt = async (paymentId: string) => {
    const readyUrl = readyReceipts[paymentId];
    if (readyUrl) {
      window.open(readyUrl, "_blank");
      return;
    }
    setReceiptLoading(paymentId);
    try {
      // Receipts are generated async — try fetching; if not ready, poll.
      const receipt = await feeApi.getReceipt(paymentId);
      if (receipt.attachmentUrl) {
        setReadyReceipts((prev) => ({ ...prev, [paymentId]: receipt.attachmentUrl as string }));
        window.open(receipt.attachmentUrl, "_blank");
        return;
      }
      startPolling(paymentId);
      toast.info("Receipt is being generated — it will open automatically when ready.");
    } catch {
      startPolling(paymentId);
      toast.info("Receipt not ready yet — it will open automatically when ready.");
    } finally {
      setReceiptLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-neutral-400">Loading…</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <EmptyState title="Invoice not found" description="This invoice may have been removed." />
      </div>
    );
  }

  const outstanding = Math.max(0, invoice.owed);

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: "Finance", href: "/finance" },
          { label: "Invoices", href: "/fees/invoices" },
          { label: `Invoice ${invoice.id.slice(0, 8)}…` },
        ]}
      />
      <PageHeader
        title={`Invoice ${invoice.id.slice(0, 8)}…`}
        description={
          invoice.enrollment
            ? `${invoice.enrollment.studentName} · ${invoice.enrollment.className} ${invoice.enrollment.sectionName}`
            : undefined
        }
        actions={
          canPay && outstanding > 0 ? (
            <Button
              text="Record Payment"
              icon={<CreditCardIcon className="size-4" />}
              className="w-auto"
              onClick={() => setPaymentDialogOpen(true)}
            />
          ) : undefined
        }
      />

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-4">
          <p className="text-xs text-neutral-400">Amount</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{formatCurrency(invoice.amount)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-4">
          <p className="text-xs text-neutral-400">Paid</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">{formatCurrency(invoice.paidToDate)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-4">
          <p className="text-xs text-neutral-400">Outstanding</p>
          <p className={`mt-1 text-lg font-semibold ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {formatCurrency(outstanding)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-4">
          <p className="text-xs text-neutral-400">Status</p>
          <div className="mt-1">
            <StatusBadge status={STATUS_LABEL[invoice.status]} variant={STATUS_VARIANT[invoice.status]} />
          </div>
        </div>
      </section>

      {invoice.installment && (
        <DashboardWidget title="Installment Details">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-neutral-400">Due Date</p>
              <p className="mt-0.5 text-sm font-medium text-neutral-900">{formatDate(invoice.installment.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Installment Amount</p>
              <p className="mt-0.5 text-sm font-medium text-neutral-900">{formatCurrency(invoice.installment.amount)}</p>
            </div>
            {invoice.installment.billingPeriod && (
              <div>
                <p className="text-xs text-neutral-400">Period</p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900">{invoice.installment.billingPeriod}</p>
              </div>
            )}
          </div>
        </DashboardWidget>
      )}

      <DashboardWidget
        title="Student Fee Overview"
        description="Outstanding fees across every academic year this student has attended"
      >
        {studentFeesLoading ? (
          <div className="text-sm text-neutral-400">Loading student fees…</div>
        ) : !studentFees ? (
          <EmptyState
            title="No fee data"
            description="This student has no fee records."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-neutral-200 bg-bg-subtle p-3">
                <p className="text-xs text-neutral-400">Total billed (all years)</p>
                <p className="mt-1 font-semibold text-neutral-900">
                  {formatCurrency(studentFees.totalAnnualFee)}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-bg-subtle p-3">
                <p className="text-xs text-neutral-400">Total paid</p>
                <p className="mt-1 font-semibold text-emerald-600">
                  {formatCurrency(studentFees.totalPaid)}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-bg-subtle p-3">
                <p className="text-xs text-neutral-400">Total outstanding</p>
                <p className={`mt-1 font-semibold ${studentFees.totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(studentFees.totalDue)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {studentFees.yearGroups.map((year) => {
                const yearInvoices = studentFees.invoices.filter(
                  (inv) => inv.academicYearLabel === year.academicYearLabel,
                );
                if (yearInvoices.length === 0) return null;
                return (
                  <div key={year.academicYearLabel || "(no year)"}>
                    {!year.isCurrent ? (
                      <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <AlertTriangleIcon className="size-4 flex-none" />
                        <p className="font-medium">Overdue from {year.academicYearLabel}</p>
                        {year.totalDue > 0 && (
                          <p className="text-xs">
                            {formatCurrency(year.totalDue)} still owed from this session
                          </p>
                        )}
                      </div>
                    ) : (
                      <h4 className="mb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                        {year.academicYearLabel || "Current year"}
                      </h4>
                    )}
                    <div className="overflow-hidden rounded-lg border border-neutral-200">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-neutral-100 bg-bg-subtle">
                            <th className="px-4 py-2 text-xs font-medium text-neutral-400">Installment</th>
                            <th className="px-4 py-2 text-xs font-medium text-neutral-400">Due date</th>
                            <th className="px-4 py-2 text-xs font-medium text-neutral-400">Amount</th>
                            <th className="px-4 py-2 text-xs font-medium text-neutral-400">Paid</th>
                            <th className="px-4 py-2 text-xs font-medium text-neutral-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearInvoices.map((inv) => (
                            <tr key={inv.id} className="border-b border-neutral-50 last:border-0">
                              <td className="px-4 py-2 text-neutral-800">{inv.installmentLabel}</td>
                              <td className="px-4 py-2 text-neutral-700">{formatDate(inv.dueDate)}</td>
                              <td className="px-4 py-2 text-neutral-700">{formatCurrency(inv.amount)}</td>
                              <td className="px-4 py-2 text-neutral-700">{formatCurrency(inv.amountPaid)}</td>
                              <td className="px-4 py-2">
                                <StatusBadge
                                  status={STATUS_LABEL[inv.status]}
                                  variant={STATUS_VARIANT[inv.status]}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DashboardWidget>

      {(isSuperAdmin || isPrincipal) && (
        <div className="flex items-center gap-2">
          <Button
            text="Apply Discount"
            variant="outline"
            className="w-auto"
            disabled={!isPrincipal}
            title={isPrincipal ? undefined : "Only Principal can apply discounts"}
            onClick={() => setDiscountDialogOpen(true)}
          />
          <Button
            text="Apply Scholarship"
            variant="outline"
            className="w-auto"
            disabled={!isPrincipal}
            title={isPrincipal ? undefined : "Only Principal can apply scholarships"}
            onClick={() => setScholarshipDialogOpen(true)}
          />
        </div>
      )}

      <DashboardWidget title="Payment History">
        {!invoice.payments || invoice.payments.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon className="size-5" />}
            title="No payments recorded"
            description="Payments made against this invoice will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-4 py-2.5 text-xs font-medium text-neutral-400">Date</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-neutral-400">Amount</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-neutral-400">Method</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-neutral-400">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-4 py-2.5 text-neutral-700">{formatDate(p.paidAt)}</td>
                    <td className="px-4 py-2.5 font-medium text-neutral-900">{formatCurrency(p.amountPaid)}</td>
                    <td className="px-4 py-2.5 text-neutral-700">{PAYMENT_LABEL[p.paymentMethod]}</td>
                    <td className="px-4 py-2.5">
                      {readyReceipts[p.id] ? (
                        <button
                          type="button"
                          onClick={() => window.open(readyReceipts[p.id], "_blank")}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                        >
                          <FileTextIcon className="size-3.5" />
                          Open Receipt
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleViewReceipt(p.id)}
                          disabled={receiptLoading === p.id || pollingPaymentId === p.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                        >
                          <FileTextIcon className="size-3.5" />
                          {receiptLoading === p.id || pollingPaymentId === p.id
                            ? "Loading…"
                            : "View"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardWidget>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        title="Record Payment"
        description="Record a cash, bank, or cheque payment against this invoice."
      >
        <RecordPaymentForm outstanding={outstanding} onPay={handlePayment} onClose={() => setPaymentDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={discountDialogOpen}
        onClose={() => setDiscountDialogOpen(false)}
        title="Apply Discount"
        description="Reduce the fee for this enrollment's structure."
      >
        {invoice.enrollment && (
          <DiscountForm
            enrollmentId={invoice.enrollment.id}
            feeStructureId={invoice.installment?.feeStructureId ?? ""}
            onApply={handleDiscount}
            onClose={() => setDiscountDialogOpen(false)}
          />
        )}
      </Dialog>

      <Dialog
        open={scholarshipDialogOpen}
        onClose={() => setScholarshipDialogOpen(false)}
        title="Apply Scholarship"
        description="Apply a percentage or fixed scholarship for this enrollment."
      >
        {invoice.enrollment && (
          <ScholarshipFormComponent
            enrollmentId={invoice.enrollment.id}
            onApply={handleScholarship}
            onClose={() => setScholarshipDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
}

export default FeeInvoiceDetailPage;
