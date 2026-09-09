import { apiClient } from "@/shared/lib/apiClient";
import type { InvoiceStatus } from "./feeApi";

export interface FinanceStructureRow {
  id: string;
  feeTypeId: string;
  feeTypeName: string;
  feeTypeCategory: string;
  academicYearId: string;
  academicYearLabel: string;
  amount: number;
  installments: number;
  invoicesGenerated: number;
}

export interface FinanceClassRow {
  classId: string;
  className: string;
  sections: string[];
  students: number;
  structureCount: number;
  installmentCount: number;
  invoiceCount: number;
  structures: FinanceStructureRow[];
}

export interface FinanceSummaryInvoiceHit {
  id: string;
  amount: number;
  paidToDate: number;
  owed: number;
  status: InvoiceStatus;
  dueDate: string;
  installmentLabel: string;
}

export interface FinanceSearchHit {
  studentId: string;
  fullName: string;
  admissionNumber: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  invoices: FinanceSummaryInvoiceHit[];
}

export interface FinanceSummary {
  academicYearLabel: string | null;
  summary: {
    collectedThisTerm: number;
    outstanding: number;
    overdueCount: number;
  };
  classes: FinanceClassRow[];
  search: FinanceSearchHit[];
}

export const financeApi = {
  async getSummary(search?: string): Promise<FinanceSummary> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await apiClient.get<{ data: FinanceSummary }>(
      `/fees/summary${qs}`,
    );
    return data.data;
  },
};

export default financeApi;