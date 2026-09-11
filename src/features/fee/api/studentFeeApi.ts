import { apiClient } from "@/shared/lib/apiClient";

export type InvoiceStatus = "DRAFT" | "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "BANK" | "CHEQUE" | "OTHER";
export type ScholarshipType = "PERCENTAGE" | "FIXED";

export interface FeeInvoiceRecord {
  id: string;
  academicYearLabel: string;
  isCurrentYear: boolean;
  installmentLabel: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
}

export interface FeePaymentRecord {
  id: string;
  invoiceId: string;
  academicYearLabel: string;
  installmentLabel: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  receiptNumber: string | null;
  receiptUrl: string | null;
}

export interface FeeDiscountRecord {
  id: string;
  kind: "DISCOUNT" | "SCHOLARSHIP";
  label: string;

  amount: number | null;
  scholarshipType: ScholarshipType | null;

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
