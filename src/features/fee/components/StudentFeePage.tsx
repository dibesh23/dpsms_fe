"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { useTable } from "@/shared/hooks/useTable";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import {
  studentFeeApi,
  type StudentFeeSummary,
  type FeeInvoiceRecord,
  type FeePaymentRecord,
  type InvoiceStatus,
  type PaymentMethod,
} from "../api/studentFeeApi";
import {
  AlertTriangleIcon,
  CreditCardIcon,
  FileTextIcon,
  TrendingUpIcon,
} from "@/shared/components/ui/icons";

const INVOICE_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

const INVOICE_VARIANT: Record<InvoiceStatus, StatusVariant> = {
  DRAFT: "neutral",
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
};

const INVOICE_FILTERS: { value: InvoiceStatus; label: string }[] = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "DRAFT", label: "Draft" },
];

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK: "Bank Transfer",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

const PAYMENT_METHOD_FILTERS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const EMPTY_SUMMARY: StudentFeeSummary = {
  academicYearLabel: "",
  totalAnnualFee: 0,
  totalPaid: 0,
  totalDue: 0,
  discounts: [],
  invoices: [],
  payments: [],
  yearGroups: [],
};

/** Extracted so the DataTable column config below only ever holds a
 *  simple `<ReceiptLink .../>` call, not an inline ternary with a
 *  nested anchor tag. */
function ReceiptLink({ payment }: { payment: FeePaymentRecord }) {
  if (!payment.receiptUrl) {
    return <span className="text-xs text-neutral-400">Not available</span>;
  }
  return (
    
      <a href={payment.receiptUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
    >
      <FileTextIcon className="size-3.5" />
      {payment.receiptNumber ?? "View"}
    </a>
  );
}

export function StudentFeePage() {
  const [summary, setSummary] = useState<StudentFeeSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await studentFeeApi.getSummary();
      setSummary(data);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const INVOICE_COLUMNS: Column<FeeInvoiceRecord>[] = useMemo(
    () => [
      {
        key: "installment",
        header: "Installment",
        sortValue: (invoice) => invoice.installmentLabel,
        render: (invoice) => (
          <div>
            <p className="font-medium text-neutral-900">{invoice.installmentLabel}</p>
            <p className="text-xs text-neutral-400">Due {formatDate(invoice.dueDate)}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortValue: (invoice) => invoice.amount,
        render: (invoice) => (
          <span className="text-neutral-700">{formatCurrency(invoice.amount)}</span>
        ),
      },
      {
        key: "paid",
        header: "Paid",
        sortValue: (invoice) => invoice.amountPaid,
        render: (invoice) => (
          <span className="text-neutral-700">{formatCurrency(invoice.amountPaid)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (invoice) => invoice.status,
        render: (invoice) => (
          <StatusBadge status={INVOICE_LABEL[invoice.status]} variant={INVOICE_VARIANT[invoice.status]} />
        ),
      },
    ],
    [],
  );

  const PAYMENT_COLUMNS: Column<FeePaymentRecord>[] = useMemo(
    () => [
      {
        key: "paidAt",
        header: "Date",
        sortValue: (payment) => payment.paidAt,
        render: (payment) => (
          <span className="text-neutral-700">{formatDate(payment.paidAt)}</span>
        ),
      },
      {
        key: "installment",
        header: "Installment",
        sortValue: (payment) => payment.installmentLabel,
        render: (payment) => (
          <span className="text-neutral-700">{payment.installmentLabel}</span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortValue: (payment) => payment.amountPaid,
        render: (payment) => (
          <span className="font-medium text-neutral-900">{formatCurrency(payment.amountPaid)}</span>
        ),
      },
      {
        key: "method",
        header: "Method",
        sortValue: (payment) => payment.paymentMethod,
        render: (payment) => (
          <StatusBadge
            status={PAYMENT_METHOD_LABEL[payment.paymentMethod]}
            variant="neutral"
            dot={false}
          />
        ),
      },
      {
        key: "receipt",
        header: "Receipt",
        render: (payment) => <ReceiptLink payment={payment} />,
      },
    ],
    [],
  );

  const invoiceTable = useTable<FeeInvoiceRecord>({
    data: summary.invoices,
    pageSize: 8,
    getSearchText: (invoice) => `${invoice.installmentLabel} ${invoice.status}`,
    filterMatch: (invoice, value) => invoice.status === value,
    sortValue: (invoice, key) => {
      if (key === "amount") return invoice.amount;
      if (key === "paid") return invoice.amountPaid;
      if (key === "status") return invoice.status;
      return invoice.installmentLabel;
    },
    defaultSortKey: "installment",
  });

  const paymentTable = useTable<FeePaymentRecord>({
    data: summary.payments,
    pageSize: 8,
    getSearchText: (payment) =>
      `${payment.installmentLabel} ${payment.paymentMethod} ${payment.receiptNumber ?? ""}`,
    filterMatch: (payment, value) => payment.paymentMethod === value,
    sortValue: (payment, key) => {
      if (key === "amount") return payment.amountPaid;
      if (key === "method") return payment.paymentMethod;
      if (key === "installment") return payment.installmentLabel;
      return payment.paidAt;
    },
    defaultSortKey: "paidAt",
  });

  const invoiceFilters = useMemo(
    () =>
      INVOICE_FILTERS.map((option) => ({
        ...option,
        label: `${option.label} (${summary.invoices.filter((i) => i.status === option.value).length})`,
      })),
    [summary.invoices],
  );

  const paymentFilters = useMemo(
    () =>
      PAYMENT_METHOD_FILTERS.map((option) => ({
        ...option,
        label: `${option.label} (${
          summary.payments.filter((p) => p.paymentMethod === option.value).length
        })`,
      })),
    [summary.payments],
  );

  const paidPercent =
    summary.totalAnnualFee > 0
      ? Math.min(Math.round((summary.totalPaid / summary.totalAnnualFee) * 100), 100)
      : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fees & Payments"
        description={
          summary.academicYearLabel ? `Academic Year ${summary.academicYearLabel}` : undefined
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard
          label="Total Annual Fee"
          value={loading ? "-" : formatCurrency(summary.totalAnnualFee)}
          icon={<CreditCardIcon className="size-4" />}
        />
        <StatsCard
          label="Total Paid"
          value={loading ? "-" : formatCurrency(summary.totalPaid)}
          delta={loading ? undefined : `${paidPercent}% of total`}
          deltaDirection="up"
          icon={<TrendingUpIcon className="size-4" />}
        />
        <StatsCard
          label="Total Due"
          value={loading ? "-" : formatCurrency(summary.totalDue)}
          deltaDirection={summary.totalDue > 0 ? "down" : "neutral"}
          delta={loading ? undefined : summary.totalDue > 0 ? "Payment pending" : "All settled"}
          icon={<AlertTriangleIcon className="size-4" />}
        />
        <StatsCard
          label="Discounts / Scholarships"
          value={loading ? "-" : String(summary.discounts.length)}
          icon={<FileTextIcon className="size-4" />}
        />
      </section>

      <DashboardWidget title="Payment Progress" description="Paid vs. total annual fee">
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all"
            style={{ width: `${paidPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
          <span>{formatCurrency(summary.totalPaid)} paid</span>
          <span>{paidPercent}%</span>
          <span>{formatCurrency(summary.totalAnnualFee)} total</span>
        </div>

        {summary.discounts.length > 0 && (
          <ul className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100 pt-2">
            {summary.discounts.map((discount) => (
              <li key={discount.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-neutral-800">{discount.label}</p>
                  <p className="text-xs text-neutral-400">
                    {discount.kind === "SCHOLARSHIP" ? "Scholarship" : "Discount"}
                  </p>
                </div>
                <span className="font-medium text-emerald-600">
                  {discount.kind === "SCHOLARSHIP" && discount.scholarshipType === "PERCENTAGE"
                    ? `${discount.percentageOrAmount}% off`
                    : formatCurrency(discount.amount ?? discount.percentageOrAmount ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardWidget>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900">Invoices</h2>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              label="Filter by status"
              options={invoiceFilters}
              value={invoiceTable.filter}
              onChange={invoiceTable.setFilter}
            />
            <SearchBar
              value={invoiceTable.query}
              onChange={invoiceTable.setQuery}
              placeholder="Search invoices..."
            />
          </div>
        </div>

        {invoiceTable.rows.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
            No invoices found. Try adjusting your search or filters.
          </div>
        ) : (
          <div className="space-y-6">
            {summary.yearGroups.map((year) => {
              const yearInvoices = invoiceTable.rows.filter(
                (inv) => inv.academicYearLabel === year.academicYearLabel,
              );
              if (yearInvoices.length === 0) return null;
              return (
                <section key={year.academicYearLabel || "(no year)"} className="space-y-2">
                  {!year.isCurrent ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertTriangleIcon className="size-4 flex-none" />
                      <p className="font-medium">Overdue from {year.academicYearLabel}</p>
                      {year.totalDue > 0 && (
                        <p className="text-xs">
                          {formatCurrency(year.totalDue)} still owed from this session
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                        {year.academicYearLabel || "Current year"}
                      </h3>
                      {year.totalDue > 0 && (
                        <p className="text-xs text-neutral-500">
                          {formatCurrency(year.totalDue)} due
                        </p>
                      )}
                    </div>
                  )}
                  <DataTable
                    columns={INVOICE_COLUMNS}
                    data={yearInvoices}
                    keyExtractor={(invoice) => invoice.id}
                    sortKey={invoiceTable.sortKey}
                    sortDir={invoiceTable.sortDir}
                    onSort={invoiceTable.handleSort}
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900">Payment History</h2>
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              label="Filter by method"
              options={paymentFilters}
              value={paymentTable.filter}
              onChange={paymentTable.setFilter}
            />
            <SearchBar
              value={paymentTable.query}
              onChange={paymentTable.setQuery}
              placeholder="Search payments..."
            />
          </div>
        </div>
        <DataTable
          columns={PAYMENT_COLUMNS}
          data={paymentTable.pageRows}
          keyExtractor={(payment) => payment.id}
          sortKey={paymentTable.sortKey}
          sortDir={paymentTable.sortDir}
          onSort={paymentTable.handleSort}
          empty={{
            title: "No payments found",
            description: "Payments you make will show up here with a receipt link.",
          }}
          footer={
            <Pagination
              page={paymentTable.page}
              pageSize={paymentTable.pageSize}
              total={paymentTable.total}
              onPageChange={paymentTable.setPage}
              label="payments"
            />
          }
        />
      </div>
    </div>
  );
}

export default StudentFeePage;