import { apiClient } from "@/shared/lib/apiClient";

export type FeeCategory = "ADMISSION" | "MONTHLY" | "EXAM" | "TRANSPORT" | "HOSTEL" | "OTHER";
export type InvoiceStatus = "DRAFT" | "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "BANK" | "CHEQUE" | "OTHER";
export type ScholarshipType = "PERCENTAGE" | "FIXED";

export const FEE_CATEGORIES: { value: FeeCategory; label: string }[] = [
  { value: "ADMISSION", label: "Admission" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "EXAM", label: "Exam" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "OTHER", label: "Other" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export const SCHOLARSHIP_TYPES: { value: ScholarshipType; label: string }[] = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED", label: "Fixed Amount" },
];

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
];

// ── Records ────────────────────────────────────────

export interface FeeTypeRecord {
  id: string;
  name: string;
  category: FeeCategory;
  isRecurringAnnually: boolean;
}

export interface FeeTypeListResult {
  items: FeeTypeRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FeeStructureRecord {
  id: string;
  feeTypeId: string;
  classId: string;
  academicYearId: string;
  amount: number;
  feeType?: { id: string; name: string; category: FeeCategory } | null;
  installments?: { id: string; dueDate: string; amount: number; billingPeriod: string | null }[];
}

export interface InvoiceRecord {
  id: string;
  enrollmentId: string;
  feeInstallmentId: string;
  amount: number;
  status: InvoiceStatus;
  publishedAt: string | null;
  paidToDate: number;
  owed: number;
  studentName: string | null;
  className: string | null;
  sectionName: string | null;
}

export interface InvoiceListResult {
  items: InvoiceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InvoiceDetailRecord extends InvoiceRecord {
  enrollment?: {
    id: string;
    studentId: string;
    rollNumber: string;
    studentName: string;
    className: string;
    sectionName: string;
  };
  installment?: { id: string; dueDate: string; amount: number; billingPeriod: string | null; feeStructureId: string } | null;
  payments?: { id: string; amountPaid: number; paymentMethod: PaymentMethod; paidAt: string }[];
}

export interface InvoiceGenerationResult {
  structureId: string;
  totalPairs: number;
  created: number;
  skipped: number;
  priorYearUnpaid: Array<{
    studentId: string;
    studentName: string;
    paid: number;
    owed: number;
  }>;
}

export interface StudentFeeYearGroup {
  academicYearLabel: string;
  isCurrent: boolean;
  totalAnnualFee: number;
  totalPaid: number;
  totalDue: number;
}

export interface StudentFeeSummaryRecord {
  academicYearLabel: string;
  totalAnnualFee: number;
  totalPaid: number;
  totalDue: number;
  discounts: {
    id: string;
    kind: "DISCOUNT" | "SCHOLARSHIP";
    label: string;
    amount: number | null;
    scholarshipType: ScholarshipType | null;
    percentageOrAmount: number | null;
  }[];
  invoices: {
    id: string;
    academicYearLabel: string;
    isCurrentYear: boolean;
    installmentLabel: string;
    dueDate: string;
    amount: number;
    amountPaid: number;
    status: InvoiceStatus;
  }[];
  payments: {
    id: string;
    invoiceId: string;
    academicYearLabel: string;
    installmentLabel: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paidAt: string;
    receiptNumber: string | null;
    receiptUrl: string | null;
  }[];
  yearGroups: StudentFeeYearGroup[];
}

export interface PaymentRecordResult {
  payment: { id: string; invoiceId: string; amountPaid: number; paymentMethod: PaymentMethod; paidAt: string };
  paidToDate: number;
  due: number;
  status: InvoiceStatus;
}

export interface DiscountRecord {
  id: string;
  enrollmentId: string;
  feeStructureId: string;
  amount: number;
  reason: string | null;
  approvedByUserId: string;
}

export interface ScholarshipRecord {
  id: string;
  enrollmentId: string;
  percentageOrAmount: number;
  type: ScholarshipType;
  approvedByUserId: string;
}

export interface ReceiptRecord {
  id: string;
  receiptNumber: string;
  attachmentUrl: string | null;
  payment: { id: string; amountPaid: number; paymentMethod: PaymentMethod; paidAt: string };
}

// ── API functions ──────────────────────────────────

export const feeApi = {
  // Fee Types
  async listFeeTypes(params?: { category?: FeeCategory; page?: number; pageSize?: number }): Promise<FeeTypeListResult> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const qs = query.toString();
    const { data } = await apiClient.get<{ data: FeeTypeListResult }>(`/fees/types${qs ? `?${qs}` : ""}`);
    return data.data;
  },

  async createFeeType(input: { name: string; category: FeeCategory; isRecurringAnnually?: boolean }): Promise<FeeTypeRecord> {
    const { data } = await apiClient.post<{ data: FeeTypeRecord }>("/fees/types", input);
    return data.data;
  },

  // Fee Structures
  async createStructure(input: { feeTypeId: string; classId: string; academicYearId: string; amount: number }): Promise<FeeStructureRecord> {
    const { data } = await apiClient.post<{ data: FeeStructureRecord }>("/fees/structures", input);
    return data.data;
  },

  async listStructures(params?: { classId?: string; academicYearId?: string }): Promise<FeeStructureRecord[]> {
    const query = new URLSearchParams();
    if (params?.classId) query.set("classId", params.classId);
    if (params?.academicYearId) query.set("academicYearId", params.academicYearId);
    const qs = query.toString();
    // Backend doesn't have a dedicated list-structures endpoint; structures come
    // attached to the create response and via generate-invoices. For the list page
    // we query invoices grouped by structure. If the backend adds a GET /fees/structures
    // later, swap this call.
    const { data } = await apiClient.get<{ data: FeeStructureRecord[] }>(`/fees/structures${qs ? `?${qs}` : ""}`);
    return data.data;
  },

  async addInstallments(
    structureId: string,
    installments: { dueDate: string; amount: number; billingPeriod?: string | null }[],
  ): Promise<FeeStructureRecord> {
    const { data } = await apiClient.post<{ data: FeeStructureRecord }>(`/fees/structures/${structureId}/installments`, { installments });
    return data.data;
  },

  async generateInvoices(structureId: string): Promise<InvoiceGenerationResult> {
    const { data } = await apiClient.post<{ data: InvoiceGenerationResult }>(`/fees/structures/${structureId}/generate-invoices`);
    return data.data;
  },

  // Invoices
  async listInvoices(params?: {
    classId?: string;
    sectionId?: string;
    status?: InvoiceStatus;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<InvoiceListResult> {
    const query = new URLSearchParams();
    if (params?.classId) query.set("classId", params.classId);
    if (params?.sectionId) query.set("sectionId", params.sectionId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    const { data } = await apiClient.get<{ data: InvoiceListResult }>(`/fees/invoices${qs ? `?${qs}` : ""}`);
    return data.data;
  },

  async getInvoice(id: string): Promise<InvoiceDetailRecord> {
    const { data } = await apiClient.get<{ data: InvoiceDetailRecord }>(`/fees/invoices/${id}`);
    return data.data;
  },

  // Admin student fee lookup — grouped across every academic year the
  // student has ever been enrolled in.
  async getStudentFeeSummary(studentId: string): Promise<StudentFeeSummaryRecord> {
    const { data } = await apiClient.get<{ data: StudentFeeSummaryRecord }>(
      `/fees/students/${studentId}/fees`,
    );
    return data.data;
  },

  async recordPayment(
    invoiceId: string,
    input: { amountPaid: number; paymentMethod: PaymentMethod; paidAt?: string },
  ): Promise<PaymentRecordResult> {
    const { data } = await apiClient.post<{ data: PaymentRecordResult }>(`/fees/invoices/${invoiceId}/payments`, input);
    return data.data;
  },

  // Discounts / Scholarships
  async applyDiscount(input: {
    enrollmentId: string;
    feeStructureId: string;
    amount: number;
    reason?: string;
  }): Promise<DiscountRecord> {
    const { data } = await apiClient.post<{ data: DiscountRecord }>("/fees/discounts", input);
    return data.data;
  },

  async applyScholarship(input: {
    enrollmentId: string;
    percentageOrAmount: number;
    type: ScholarshipType;
  }): Promise<ScholarshipRecord> {
    const { data } = await apiClient.post<{ data: ScholarshipRecord }>("/fees/scholarships", input);
    return data.data;
  },

  // Receipts
  async getReceipt(id: string): Promise<ReceiptRecord> {
    const { data } = await apiClient.get<{ data: ReceiptRecord }>(`/fees/receipts/${id}`);
    return data.data;
  },
};

export default feeApi;
