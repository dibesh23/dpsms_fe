"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { Field, Select } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { ViewToggle } from "@/shared/components/ui/view-toggle";
import { Breadcrumbs } from "@/shared/components/ui/breadcrumbs";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useStoredView } from "@/shared/hooks/useStoredView";
import { useTable } from "@/shared/hooks/useTable";
import { PERMISSIONS } from "@/shared/permissions";
import {
  academicApi,
  type ClassRecord,
  type SessionRecord,
} from "@/features/academic/api/academicApi";
import {
  feeApi,
  type FeeTypeRecord,
  type FeeStructureRecord,
  FEE_CATEGORIES,
  type FeeCategory,
} from "../api/feeApi";
import { formatCurrency } from "@/shared/lib/format";
import {
  ArrowUpRightIcon,
  LayoutGridIcon,
  GraduationCapIcon,
  PlusIcon,
} from "@/shared/components/ui/icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const CATEGORY_LABEL: Record<FeeCategory, string> = Object.fromEntries(
  FEE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<FeeCategory, string>;

const CreateSchema = z.object({
  feeTypeId: z.string().min(1, "Fee type is required"),
  classId: z.string().min(1, "Class is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  amount: z.number().int().positive("Amount must be a positive integer"),
});
type CreateValues = z.infer<typeof CreateSchema>;

function CreateStructureForm({
  feeTypes,
  classes,
  sessions,
  defaultClassId,
  onAdd,
  onClose,
}: {
  feeTypes: FeeTypeRecord[];
  classes: ClassRecord[];
  sessions: SessionRecord[];
  defaultClassId?: string;
  onAdd: (values: CreateValues) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(CreateSchema),
    defaultValues: { feeTypeId: "", classId: defaultClassId ?? "", academicYearId: "", amount: 0 },
  });

  const onSubmit = async (values: CreateValues) => {
    setApiError(null);
    const ok = await onAdd(values);
    if (!ok) setApiError("Could not create structure. Check for duplicate combinations.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Fee Type" error={errors.feeTypeId?.message} required>
        <Select {...register("feeTypeId")} disabled={isSubmitting}>
          <option value="">Select fee type…</option>
          {feeTypes.map((ft) => (
            <option key={ft.id} value={ft.id}>
              {ft.name} ({CATEGORY_LABEL[ft.category]})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Class" error={errors.classId?.message} required>
        <Select {...register("classId")} disabled={isSubmitting || !!defaultClassId}>
          <option value="">Select class…</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Academic Year" error={errors.academicYearId?.message} required>
        <Select {...register("academicYearId")} disabled={isSubmitting}>
          <option value="">Select year…</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Total Amount"
        error={errors.amount?.message}
        required
        hint="Total fee for this structure (will be split into installments)"
      >
        <Input
          type="number"
          {...register("amount", { valueAsNumber: true })}
          placeholder="e.g. 24000"
          disabled={isSubmitting}
        />
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
          text={isSubmitting ? "Creating…" : "Create Structure"}
          loading={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

const VIEW_OPTIONS = [
  { value: "classes", label: "By Class" },
  { value: "all", label: "All" },
];

interface StructureAllRow {
  id: string;
  feeTypeId: string;
  feeTypeName: string;
  category: FeeCategory;
  className: string;
  classId: string;
  yearLabel: string;
  amount: number;
  installments: number;
}

export function FeeStructuresPage() {
  const [structures, setStructures] = useState<FeeStructureRecord[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useStoredView("fee-structures-view", "classes");
  const toast = useToast();
  const { can } = useAuth();
  const canManage = can(PERMISSIONS.FEE_STRUCTURE_MANAGE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [types, cls, sess] = await Promise.all([
        feeApi.listFeeTypes({ pageSize: 100 }),
        academicApi.listClasses(),
        academicApi.listSessions(),
      ]);
      setFeeTypes(types.items);
      setClasses(cls);
      setSessions(sess);
      try {
        const structs = await feeApi.listStructures();
        setStructures(structs);
      } catch {
        setStructures([]);
      }
    } catch {
      setStructures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: CreateValues): Promise<boolean> => {
    try {
      await feeApi.createStructure(values);
      await load();
      setDialogOpen(false);
      toast.success("Fee structure created. Now add installments.");
      return true;
    } catch {
      return false;
    }
  };

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const classStructureCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of structures) {
      map.set(s.classId, (map.get(s.classId) ?? 0) + 1);
    }
    return map;
  }, [structures]);

  const classTotalAmount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of structures) {
      map.set(s.classId, (map.get(s.classId) ?? 0) + s.amount);
    }
    return map;
  }, [structures]);

  const filteredClasses = useMemo(() => {
    if (!query.trim()) return classes;
    const q = query.toLowerCase();
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, query]);

  const selectedClass = selectedClassId
    ? (classes.find((c) => c.id === selectedClassId) ?? null)
    : null;

  const classStructures = useMemo(() => {
    if (!selectedClassId) return [];
    const filtered = structures.filter((s) => s.classId === selectedClassId);
    if (!query.trim()) return filtered;
    const q = query.toLowerCase();
    return filtered.filter((s) => {
      const typeName = s.feeType?.name ?? "";
      return typeName.toLowerCase().includes(q);
    });
  }, [structures, selectedClassId, query]);

  const allRows: StructureAllRow[] = useMemo(
    () =>
      structures.map((s) => ({
        id: s.id,
        feeTypeId: s.feeTypeId,
        feeTypeName: s.feeType?.name ?? "Unknown Type",
        category: s.feeType?.category ?? "OTHER",
        className: classMap.get(s.classId)?.name ?? "—",
        classId: s.classId,
        yearLabel: sessionMap.get(s.academicYearId)?.label ?? "—",
        amount: s.amount,
        installments: s.installments?.length ?? 0,
      })),
    [structures, classMap, sessionMap],
  );

  const table = useTable<StructureAllRow>({
    data: allRows,
    pageSize: 12,
    getSearchText: (row) => `${row.feeTypeName} ${row.className} ${row.yearLabel}`,
    filterMatch: (row, value) => row.classId === value,
    defaultSortKey: "feeTypeName",
  });

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as "classes" | "all");
    setSelectedClassId(null);
    setQuery("");
  };

  const allColumns: Column<StructureAllRow>[] = useMemo(
    () => [
      {
        key: "feeTypeName",
        header: "Fee Type",
        sortValue: (row) => row.feeTypeName,
        render: (row) => (
          <Link href={`/fees/structures/${row.id}`} className="group">
            <p className="font-medium text-neutral-900 group-hover:underline">{row.feeTypeName}</p>
            <p className="text-xs text-neutral-400">{CATEGORY_LABEL[row.category]}</p>
          </Link>
        ),
      },
      {
        key: "className",
        header: "Class",
        sortValue: (row) => row.className,
        render: (row) => <span className="text-neutral-700">{row.className}</span>,
      },
      {
        key: "yearLabel",
        header: "Academic Year",
        sortValue: (row) => row.yearLabel,
        render: (row) => <span className="text-neutral-700">{row.yearLabel}</span>,
      },
      {
        key: "amount",
        header: "Total Amount",
        sortValue: (row) => row.amount,
        render: (row) => <span className="text-neutral-700">{formatCurrency(row.amount)}</span>,
      },
      {
        key: "installments",
        header: "Installments",
        sortValue: (row) => row.installments,
        render: (row) => <span className="text-neutral-700">{row.installments}</span>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fee Structures"
        description={
          viewMode === "all"
            ? "All fee structures across classes and academic years"
            : selectedClass
              ? `${selectedClass.name} — Fee structures`
              : "Select a class to view fee structures"
        }
        actions={
          canManage ? (
            <Button
              text="New Structure"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      {viewMode === "all" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ViewToggle
                options={VIEW_OPTIONS}
                value={viewMode}
                onChange={handleViewModeChange}
                ariaLabel="Fee structures view"
              />
              <p className="text-sm text-neutral-500">{table.total} structures</p>
            </div>
            <div className="flex items-center gap-3">
              <FilterDropdown
                label="Filter by class"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
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
                icon={<LayoutGridIcon className="size-5" />}
                title="No fee structures found"
                description="Create a structure to assign fees to a class."
              />
            </div>
          ) : (
            <DataTable
              columns={allColumns}
              data={table.pageRows}
              keyExtractor={(row) => row.id}
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              onSort={table.handleSort}
              empty={{ title: "No results" }}
              footer={
                <Pagination
                  page={table.page}
                  pageSize={table.pageSize}
                  total={table.total}
                  onPageChange={(p) => table.setPage(p)}
                  label="structures"
                />
              }
            />
          )}
        </>
      ) : selectedClass ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle
              options={VIEW_OPTIONS}
              value={viewMode}
              onChange={handleViewModeChange}
              ariaLabel="Fee structures view"
            />
            <Breadcrumbs
              items={[
                { label: "Finance", href: "/finance" },
                { label: "Fee Structures", href: "/fees/structures" },
                { label: selectedClass.name },
              ]}
            />
            <span className="text-neutral-300">|</span>
            <p className="text-sm text-neutral-500">{classStructures.length} structures</p>
            <div className="ml-auto">
              <SearchBar value={query} onChange={setQuery} placeholder="Search fee types…" />
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
              Loading…
            </div>
          ) : classStructures.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default">
              <EmptyState
                icon={<LayoutGridIcon className="size-5" />}
                title="No fee structures for this class"
                description="Create a structure to assign fees to this class."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {classStructures.map((s) => {
                const ft = s.feeType;
                const sess = sessionMap.get(s.academicYearId);
                return (
                  <div
                    key={s.id}
                    className="flex flex-col rounded-lg border border-neutral-200 bg-bg-default p-5 transition-colors hover:border-neutral-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/fees/structures/${s.id}`} className="group min-w-0 flex-1">
                        <p className="truncate font-medium text-neutral-900 group-hover:underline">
                          {ft?.name ?? "Unknown Type"}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">{sess?.label ?? "—"}</p>
                      </Link>
                      <Link
                        href={`/fees/structures/${s.id}`}
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-subtle hover:text-neutral-700"
                      >
                        <ArrowUpRightIcon className="size-4" />
                      </Link>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                      <div>
                        <p className="text-xs text-neutral-400">Total Amount</p>
                        <p className="mt-0.5 font-medium text-neutral-800">
                          {formatCurrency(s.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-400">Installments</p>
                        <p className="mt-0.5 font-medium text-neutral-800">
                          {s.installments?.length ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ViewToggle
                options={VIEW_OPTIONS}
                value={viewMode}
                onChange={handleViewModeChange}
                ariaLabel="Fee structures view"
              />
              <p className="text-sm text-neutral-500">{classes.length} classes</p>
            </div>
            <SearchBar value={query} onChange={setQuery} placeholder="Search classes…" />
          </div>

          {loading ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
              Loading…
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default">
              <EmptyState
                icon={<GraduationCapIcon className="size-5" />}
                title="No classes found"
                description="Create classes first to set up fee structures."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredClasses.map((c) => {
                const count = classStructureCount.get(c.id) ?? 0;
                const total = classTotalAmount.get(c.id) ?? 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className="flex flex-col items-start rounded-lg border border-neutral-200 bg-bg-default p-5 text-left transition-all hover:border-neutral-300 hover:shadow-sm"
                  >
                    <div className="flex w-full items-start justify-between">
                      <div>
                        <p className="font-medium text-neutral-900">{c.name}</p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {c.sections.length > 0 ? c.sections.join(", ") : "No sections"} &middot;{" "}
                          {c.students} students
                        </p>
                      </div>
                      <ArrowUpRightIcon className="size-4 text-neutral-300" />
                    </div>
                    <div className="mt-auto flex w-full items-center justify-between border-t border-neutral-100 pt-3 mt-4">
                      <div>
                        <p className="text-xs text-neutral-400">Structures</p>
                        <p className="font-medium text-neutral-800">{count}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-400">Total Fee</p>
                        <p className="font-medium text-neutral-800">{formatCurrency(total)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {canManage && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Create Fee Structure"
          description={
            selectedClass
              ? `Add a fee structure for ${selectedClass.name}.`
              : "Assign a fee type to a class for an academic year."
          }
        >
          <CreateStructureForm
            feeTypes={feeTypes}
            classes={classes}
            sessions={sessions}
            defaultClassId={selectedClassId ?? undefined}
            onAdd={handleAdd}
            onClose={() => setDialogOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
}

export default FeeStructuresPage;
