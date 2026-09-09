"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { Field } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { feeApi, type FeeStructureRecord, type InvoiceGenerationResult } from "../api/feeApi";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  FileTextIcon,
  LayoutGridIcon,
  PlusIcon,
  CheckCircle2Icon,
} from "@/shared/components/ui/icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const InstallmentSchema = z.object({
  installments: z
    .array(
      z.object({
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
        amount: z.number().int().positive("Amount must be positive"),
        billingPeriod: z.string().optional(),
      }),
    )
    .min(1, "Add at least one installment"),
});
type InstallmentValues = z.infer<typeof InstallmentSchema>;

function AddInstallmentForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: InstallmentValues) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InstallmentValues>({
    resolver: zodResolver(InstallmentSchema),
    defaultValues: {
      installments: [{ dueDate: "", amount: 0, billingPeriod: "" }],
    },
  });

  const installments = watch("installments");

  const addRow = () => {
    setValue("installments", [...installments, { dueDate: "", amount: 0, billingPeriod: "" }]);
  };

  const removeRow = (index: number) => {
    setValue(
      "installments",
      installments.filter((_, i) => i !== index),
    );
  };

  const onSubmit = async (values: InstallmentValues) => {
    setApiError(null);
    const cleaned = values.installments.map((inst) => ({
      ...inst,
      billingPeriod: inst.billingPeriod?.trim() || undefined,
    }));
    const ok = await onAdd({ installments: cleaned });
    if (!ok) setApiError("Could not add installments.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="h-[18rem] overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-3">
          {installments.map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]"
            >
              <Field
                label={index === 0 ? "Due Date" : undefined}
                error={errors.installments?.[index]?.dueDate?.message}
                className="flex-1"
              >
                <Input
                  type="date"
                  {...register(`installments.${index}.dueDate`)}
                  disabled={isSubmitting}
                />
              </Field>
              <Field
                label={index === 0 ? "Amount" : undefined}
                error={errors.installments?.[index]?.amount?.message}
                className="sm:w-28"
              >
                <Input
                  type="number"
                  {...register(`installments.${index}.amount`, { valueAsNumber: true })}
                  placeholder="Amount"
                  disabled={isSubmitting}
                />
              </Field>
              <Field label={index === 0 ? "Label" : undefined} className="sm:w-32">
                <Input
                  {...register(`installments.${index}.billingPeriod`)}
                  placeholder="e.g. Jan"
                  disabled={isSubmitting}
                />
              </Field>
              {installments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="mb-0.5 h-10 px-2 text-neutral-400 hover:text-red-500"
                  disabled={isSubmitting}
                  aria-label={`Remove installment ${index + 1}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        disabled={isSubmitting}
      >
        <PlusIcon className="size-3.5" /> Add another installment
      </button>
      {apiError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button
          variant="secondary"
          text="Cancel"
          onClick={onClose}
          className="w-auto"
          type="button"
        />
        <Button
          text={isSubmitting ? "Adding…" : "Add Installments"}
          loading={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

export function FeeStructureDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const structureId = params.id;
  const [structure, setStructure] = useState<FeeStructureRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<InvoiceGenerationResult | null>(null);
  const toast = useToast();
  const { can } = useAuth();
  const canManage = can(PERMISSIONS.FEE_STRUCTURE_MANAGE);
  const canGenerate = can(PERMISSIONS.FEE_INVOICE_GENERATE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch structure detail via listStructures and find by id
      const structs = await feeApi.listStructures();
      const found = structs.find((s) => s.id === structureId);
      setStructure(found ?? null);
    } catch {
      setStructure(null);
    } finally {
      setLoading(false);
    }
  }, [structureId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddInstallments = async (values: InstallmentValues): Promise<boolean> => {
    try {
      const updated = await feeApi.addInstallments(structureId, values.installments);
      setStructure(updated);
      setInstallmentDialogOpen(false);
      toast.success("Installments added.");
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await feeApi.generateInvoices(structureId);
      setGenResult(result);
      setConfirmGenerate(false);
      toast.success(`Invoices generated: ${result.created} created, ${result.skipped} skipped.`);
    } catch {
      toast.error("Could not generate invoices.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-neutral-400">Loading…</div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Structure not found"
          description="This fee structure may have been removed."
        />
      </div>
    );
  }

  const columns: Column<{
    id: string;
    dueDate: string;
    amount: number;
    billingPeriod: string | null;
  }>[] = [
    {
      key: "billingPeriod",
      header: "Label",
      render: (inst) => (
        <span className="font-medium text-neutral-900">{inst.billingPeriod || "—"}</span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortValue: (inst) => inst.dueDate,
      render: (inst) => <span className="text-neutral-700">{formatDate(inst.dueDate)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      sortValue: (inst) => inst.amount,
      render: (inst) => <span className="text-neutral-700">{formatCurrency(inst.amount)}</span>,
    },
  ];

  const installments = structure.installments ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/fees/structures")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-bg-subtle hover:text-neutral-800"
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <PageHeader
          title={structure.feeType?.name ?? "Fee Structure"}
          description={`${structure.classId} · ${structure.academicYearId}`}
          actions={
            <div className="flex items-center gap-2">
              {canManage && (
                <Button
                  text="Add Installments"
                  icon={<PlusIcon className="size-4" />}
                  className="w-auto"
                  onClick={() => setInstallmentDialogOpen(true)}
                />
              )}
              {canGenerate && (
                <Button
                  text="Generate Invoices"
                  icon={<CheckCircle2Icon className="size-4" />}
                  variant="success"
                  className="w-auto"
                  onClick={() => setConfirmGenerate(true)}
                />
              )}
            </div>
          }
        />
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-4">
          <p className="type-kpi-label">Total Amount</p>
          <p className="type-kpi-sm mt-1">{formatCurrency(structure.amount)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-4">
          <p className="type-kpi-label">Installments</p>
          <p className="type-kpi-sm mt-1">{installments.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-4">
          <p className="type-kpi-label">Category</p>
          <p className="type-section-title mt-1">{structure.feeType?.category ?? "—"}</p>
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Installments</h2>
        </div>
        <DataTable
          columns={columns}
          data={installments}
          keyExtractor={(inst) => inst.id}
          sortKey="dueDate"
          sortDir="asc"
          onSort={() => {}}
          empty={{
            title: "No installments yet",
            description: "Add installments to split this fee into due-date slices.",
          }}
        />
      </div>

      {genResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <p className="font-medium">Invoice Generation Complete</p>
          <p className="mt-1">
            {genResult.created} invoices created, {genResult.skipped} skipped (already existed).
          </p>
          <Link
            href="/fees/invoices"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
          >
            View invoices <FileTextIcon className="size-3" />
          </Link>
        </div>
      )}

      {canManage && (
        <Dialog
          open={installmentDialogOpen}
          onClose={() => setInstallmentDialogOpen(false)}
          title="Add Installments"
          description="Split this fee into one or more due-date slices."
        >
          <AddInstallmentForm
            onAdd={handleAddInstallments}
            onClose={() => setInstallmentDialogOpen(false)}
          />
        </Dialog>
      )}

      <Dialog
        open={confirmGenerate}
        onClose={() => setConfirmGenerate(false)}
        title="Generate Invoices"
        description="This will create invoices for every enrolled student in this class."
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            For each enrollment in the class, one invoice per installment will be created. Existing
            invoices are skipped (idempotent).
          </p>
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button
              variant="secondary"
              text="Cancel"
              onClick={() => setConfirmGenerate(false)}
              className="w-auto"
            />
            <Button
              text={generating ? "Generating…" : "Confirm & Generate"}
              variant="success"
              loading={generating}
              disabled={generating}
              className="w-auto"
              onClick={() => void handleGenerate()}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default FeeStructureDetailPage;
