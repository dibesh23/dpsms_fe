"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ViewToggle } from "@/shared/components/ui/view-toggle";
import { Breadcrumbs } from "@/shared/components/ui/breadcrumbs";
import { useStoredView } from "@/shared/hooks/useStoredView";
import { feeApi, type InvoiceRecord, type InvoiceStatus, INVOICE_STATUSES } from "../api/feeApi";
import { academicApi, type ClassRecord } from "@/features/academic/api/academicApi";
import { formatCurrency } from "@/shared/lib/format";
import {
  FileTextIcon,
  ArrowUpRightIcon,
  GraduationCapIcon,
} from "@/shared/components/ui/icons";

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

const STATUS_FILTERS = INVOICE_STATUSES.map((s) => ({ value: s.value, label: s.label }));

const VIEW_OPTIONS = [
  { value: "classes", label: "By Class" },
  { value: "all", label: "All" },
];

export function FeeInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useStoredView("fee-invoices-view", "all");

  const activeClassId = viewMode === "all" ? classFilter : selectedClassId;

  const loadClasses = useCallback(async () => {
    try {
      const cls = await academicApi.listClasses();
      setClasses(cls);
    } catch {
      setClasses([]);
    }
  }, []);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const result = await feeApi.listInvoices({
          classId: activeClassId ?? undefined,
          status: (statusFilter as InvoiceStatus) || undefined,
          page: p,
          pageSize: 15,
          search: query || undefined,
        });
        setInvoices(result.items);
        setTotal(result.total);
        setPage(result.page);
      } catch {
        setInvoices([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [activeClassId, statusFilter, query],
  );

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedClass = selectedClassId ? classes.find((c) => c.id === selectedClassId) ?? null : null;

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as "classes" | "all");
    setSelectedClassId(null);
    setClassFilter(null);
    setQuery("");
    setStatusFilter(null);
    setPage(1);
  };

  const columns: Column<InvoiceRecord>[] = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        sortValue: (inv) => inv.studentName ?? "",
        render: (inv) => (
          <Link href={`/fees/invoices/${inv.id}`} className="group">
            <p className="font-medium text-neutral-900 group-hover:underline">
              {inv.studentName ?? "Unknown Student"}
            </p>
            <p className="text-xs text-neutral-400">{inv.id.slice(0, 8)}…</p>
          </Link>
        ),
      },
      {
        key: "class",
        header: "Class",
        sortValue: (inv) => inv.className ?? "",
        render: (inv) => (
          <span className="text-sm text-neutral-600">
            {inv.className ?? "—"}{inv.sectionName ? ` / ${inv.sectionName}` : ""}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        sortValue: (inv) => inv.amount,
        render: (inv) => <span className="text-neutral-700">{formatCurrency(inv.amount)}</span>,
      },
      {
        key: "paid",
        header: "Paid",
        sortValue: (inv) => inv.paidToDate,
        render: (inv) => <span className="text-neutral-700">{formatCurrency(inv.paidToDate)}</span>,
      },
      {
        key: "owed",
        header: "Owed",
        sortValue: (inv) => inv.owed,
        render: (inv) => (
          <span className={inv.owed > 0 ? "font-medium text-red-600" : "text-emerald-600"}>
            {formatCurrency(inv.owed)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (inv) => inv.status,
        render: (inv) => (
          <StatusBadge status={STATUS_LABEL[inv.status]} variant={STATUS_VARIANT[inv.status]} />
        ),
      },
    ],
    [],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setPage(1);
    },
    [],
  );

  const invoicesTable = (
    <DataTable
      columns={columns}
      data={invoices}
      keyExtractor={(inv) => inv.id}
      sortKey="status"
      sortDir="asc"
      onSort={() => {}}
      empty={{ title: "No results" }}
      footer={
        <Pagination
          page={page}
          pageSize={15}
          total={total}
          onPageChange={(p) => void load(p)}
          label="invoices"
        />
      }
    />
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoices"
        description={
          viewMode === "all"
            ? "All student invoices across classes"
            : selectedClass
              ? `${selectedClass.name} — Student invoices`
              : "Select a class to view invoices"
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
                ariaLabel="Invoices view"
              />
              <p className="text-sm text-neutral-500">{total} invoices</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FilterDropdown
                label="Filter by class"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                value={classFilter}
                onChange={(v) => {
                  setClassFilter(v);
                  setPage(1);
                }}
              />
              <FilterDropdown
                label="Filter by status"
                options={STATUS_FILTERS}
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              />
              <SearchBar value={query} onChange={handleSearch} placeholder="Search student name…" />
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
              Loading…
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default">
              <EmptyState
                icon={<FileTextIcon className="size-5" />}
                title="No invoices found"
                description={
                  classFilter || statusFilter || query.trim()
                    ? "No invoices match the current filters."
                    : "No invoices have been generated yet."
                }
              />
            </div>
          ) : (
            invoicesTable
          )}
        </>
      ) : selectedClass ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ViewToggle
              options={VIEW_OPTIONS}
              value={viewMode}
              onChange={handleViewModeChange}
              ariaLabel="Invoices view"
            />
            <Breadcrumbs
              items={[
                { label: "Finance", href: "/finance" },
                { label: "Invoices", href: "/fees/invoices" },
                { label: selectedClass.name },
              ]}
            />
            <span className="text-neutral-300">|</span>
            <p className="text-sm text-neutral-500">{total} invoices</p>
            <div className="ml-auto flex items-center gap-3">
              <FilterDropdown
                label="Filter by status"
                options={STATUS_FILTERS}
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              />
              <SearchBar value={query} onChange={handleSearch} placeholder="Search student name…" />
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
              Loading…
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default">
              <EmptyState
                icon={<FileTextIcon className="size-5" />}
                title="No invoices found"
                description="No invoices have been generated for this class yet."
              />
            </div>
          ) : (
            invoicesTable
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
                ariaLabel="Invoices view"
              />
              <p className="text-sm text-neutral-500">{classes.length} classes</p>
            </div>
            <SearchBar
              value={query}
              onChange={(v) => setQuery(v)}
              placeholder="Search classes…"
            />
          </div>

          {loading ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
              Loading…
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default">
              <EmptyState
                icon={<GraduationCapIcon className="size-5" />}
                title="No classes found"
                description="Create classes first to manage invoices."
              />
            </div>
          ) : (
            <ClassInvoiceGrid
              classes={classes}
              query={query}
              onSelect={(id) => {
                setSelectedClassId(id);
                setQuery("");
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function ClassInvoiceGrid({
  classes,
  query,
  onSelect,
}: {
  classes: ClassRecord[];
  query: string;
  onSelect: (classId: string) => void;
}) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled(
        classes.map(async (c) => {
          const result = await feeApi.listInvoices({ classId: c.id, pageSize: 1 });
          return { id: c.id, total: result.total };
        }),
      );
      if (cancelled) return;
      const map = new Map<string, number>();
      for (const r of results) {
        if (r.status === "fulfilled") map.set(r.value.id, r.value.total);
      }
      setCounts(map);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [classes]);

  const filtered = useMemo(() => {
    if (!query.trim()) return classes;
    const q = query.toLowerCase();
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, query]);

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
        Loading invoice counts…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((c) => {
        const count = counts.get(c.id) ?? 0;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="flex flex-col items-start rounded-lg border border-neutral-200 bg-bg-default p-5 text-left transition-all hover:border-neutral-300 hover:shadow-sm"
          >
            <div className="flex w-full items-start justify-between">
              <div>
                <p className="font-medium text-neutral-900">{c.name}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {c.sections.length > 0 ? c.sections.join(", ") : "No sections"} &middot; {c.students} students
                </p>
              </div>
              <ArrowUpRightIcon className="size-4 text-neutral-300" />
            </div>
            <div className="mt-auto border-t border-neutral-100 pt-3 mt-4">
              <p className="text-xs text-neutral-400">Invoices</p>
              <p className="font-medium text-neutral-800">{count}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default FeeInvoicesPage;
