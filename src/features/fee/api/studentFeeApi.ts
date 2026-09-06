import { apiClient } from "@/shared/lib/apiClient";

// Mirrors schema.prisma
export type InvoiceStatus = "DRAFT" | "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "BANK" | "CHEQUE" | "OTHER";
export type ScholarshipType = "PERCENTAGE" | "FIXED";

export interface FeeInvoiceRecord {
  id: string; // Invoice.id
  academicYearLabel: string; // FeeInstallment's academic year label
  isCurrentYear: boolean;
  installmentLabel: string; // FeeInstallment.billingPeriod, falls back to due date
  dueDate: string; // FeeInstallment.dueDate
  amount: number; // Invoice.amount
  amountPaid: number; // sum of FeePayment.amountPaid for this invoice
  status: InvoiceStatus; // Invoice.status
}

export interface FeePaymentRecord {
  id: string; // FeePayment.id
  invoiceId: string;
  academicYearLabel: string;
  installmentLabel: string;
  amountPaid: number; // FeePayment.amountPaid
  paymentMethod: PaymentMethod; // FeePayment.paymentMethod
  paidAt: string; // FeePayment.paidAt
  receiptNumber: string | null; // FeeReceipt.receiptNumber
  receiptUrl: string | null; // FeeReceipt.attachment.url
}

export interface FeeDiscountRecord {
  id: string;
  kind: "DISCOUNT" | "SCHOLARSHIP";
  label: string; // FeeDiscount.reason, or a scholarship label
  /** Fixed-amount discount, FeeDiscount.amount */
  amount: number | null;
  scholarshipType: ScholarshipType | null;
  /** FeeScholarship.percentageOrAmount */
  percentageOrAmount: number | null;
}

export interface FeeYearGroup {
  academicYearLabel: string;
  isCurrent: boolean;
  totalAnnualFee: number;
  totalPaid: number;
  totalDue: number;
}

export interface StudentFeeSummary {
  academicYearLabel: string;
  totalAnnualFee: number;
  totalPaid: number;
  totalDue: number;
  discounts: FeeDiscountRecord[];
  invoices: FeeInvoiceRecord[];
  payments: FeePaymentRecord[];
  yearGroups: FeeYearGroup[];
}

export const studentFeeApi = {
  async getSummary(): Promise<StudentFeeSummary> {
    const { data } = await apiClient.get<{ data: StudentFeeSummary }>("/students/me/fees");
    return data.data;
  },
};

export default studentFeeApi;