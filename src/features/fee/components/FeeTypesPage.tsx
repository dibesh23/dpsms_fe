"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { Field, Select } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { feeApi, type FeeTypeRecord, type FeeCategory, FEE_CATEGORIES } from "../api/feeApi";
import { PlusIcon, CreditCardIcon } from "@/shared/components/ui/icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const CATEGORY_LABEL: Record<FeeCategory, string> = {
  ADMISSION: "Admission",
  MONTHLY: "Monthly",
  EXAM: "Exam",
  TRANSPORT: "Transport",
  HOSTEL: "Hostel",
  OTHER: "Other",
};

const CATEGORY_FILTERS = FEE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(["ADMISSION", "MONTHLY", "EXAM", "TRANSPORT", "HOSTEL", "OTHER"]),
  isRecurringAnnually: z.boolean(),
});
type CreateValues = z.infer<typeof CreateSchema>;

function CreateFeeTypeForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: CreateValues) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(CreateSchema),
    defaultValues: { name: "", category: "MONTHLY", isRecurringAnnually: true },
  });

  const onSubmit = async (values: CreateValues) => {
    setApiError(null);
    const result = await onAdd(values);
    if (!result.success)
      setApiError(result.error ?? "Could not create fee type. It may already exist.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Name" error={errors.name?.message} required>
        <Input
          {...register("name")}
          placeholder="e.g. Monthly Tuition Fee"
          disabled={isSubmitting}
        />
      </Field>
      <Field label="Category" error={errors.category?.message} required>
        <Select {...register("category")} disabled={isSubmitting}>
          {FEE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Recurring annually">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            {...register("isRecurringAnnually")}
            className="size-4 rounded border-neutral-300"
            disabled={isSubmitting}
          />
          Automatically carry forward each academic year
        </label>
      </Field>
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
          text={isSubmitting ? "Creating…" : "Create Fee Type"}
          loading={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

export function FeeTypesPage() {
  const [types, setTypes] = useState<FeeTypeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const toast = useToast();

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const result = await feeApi.listFeeTypes({ page: p, pageSize: 20 });
      setTypes(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch {
      setTypes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: CreateValues): Promise<{ success: boolean; error?: string }> => {
    try {
      await feeApi.createFeeType(values);
      await load(1);
      setDialogOpen(false);
      toast.success("Fee type created.");
      return { success: true };
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      return {
        success: false,
        error: axiosData ?? "Could not create fee type. It may already exist.",
      };
    }
  };

  const table = useTable<FeeTypeRecord>({
    data: types,
    pageSize: 10,
    getSearchText: (t) => `${t.name} ${CATEGORY_LABEL[t.category]}`,
    filterMatch: (t, value) => t.category === value,
    sortValue: (t, key) => (key === "category" ? t.category : t.name),
    defaultSortKey: "name",
  });

  const columns: Column<FeeTypeRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortValue: (t) => t.name,
        render: (t) => <span className="font-medium text-neutral-900">{t.name}</span>,
      },
      {
        key: "category",
        header: "Category",
        sortValue: (t) => t.category,
        render: (t) => (
          <StatusBadge status={CATEGORY_LABEL[t.category]} variant="neutral" dot={false} />
        ),
      },
      {
        key: "recurring",
        header: "Recurring",
        render: (t) => (
          <span className={t.isRecurringAnnually ? "text-emerald-600" : "text-neutral-400"}>
            {t.isRecurringAnnually ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fee Types"
        description="Categories of fees your school charges"
        actions={
          <Button
            text="New Fee Type"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{table.total} fee types</p>
        <div className="flex items-center gap-3">
          <FilterDropdown
            label="Filter by category"
            options={CATEGORY_FILTERS}
            value={table.filter}
            onChange={table.setFilter}
          />
          <SearchBar
            value={table.query}
            onChange={table.setQuery}
            placeholder="Search fee types…"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
          Loading…
        </div>
      ) : table.rows.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            icon={<CreditCardIcon className="size-5" />}
            title="No fee types found"
            description="Create your first fee type to get started."
            action={
              <Button
                text="New Fee Type"
                icon={<PlusIcon className="size-4" />}
                className="w-auto"
                onClick={() => setDialogOpen(true)}
              />
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={table.pageRows}
          keyExtractor={(t) => t.id}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.handleSort}
          empty={{ title: "No results" }}
          footer={
            <Pagination
              page={page}
              pageSize={table.pageSize}
              total={total}
              onPageChange={(p) => void load(p)}
              label="fee types"
            />
          }
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Create Fee Type"
        description="Define a new category of fee."
      >
        <CreateFeeTypeForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}

export default FeeTypesPage;
