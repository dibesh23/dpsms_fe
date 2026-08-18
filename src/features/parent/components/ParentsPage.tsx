"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { AddParentForm, type AddParentValues } from "./AddParentForm";
import { parentApi } from "../api/parentApi";
import {
  HeartHandshakeIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  UserPlusIcon,
} from "@/shared/components/ui/icons";

export interface Parent {
  id: string;
  name: string;
  students: string[];
  phone: string;
  email: string;
  status: "Verified" | "Pending";
}

const STATUS_FILTERS = [
  { value: "Verified", label: "Verified" },
  { value: "Pending", label: "Pending" },
];

const toStatus = (status: string): Parent["status"] =>
  status === "PENDING" ? "Pending" : "Verified";

const toApiStatus = (status: Parent["status"]): "VERIFIED" | "PENDING" =>
  status === "Pending" ? "PENDING" : "VERIFIED";

const COLUMNS: Column<Parent>[] = [
  {
    key: "name",
    header: "Guardian",
    sortValue: (parent) => parent.name,
    render: (parent) => (
      <div className="flex items-center gap-3">
        <Avatar name={parent.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{parent.name}</p>
          <p className="text-xs text-neutral-400">{parent.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "students",
    header: "Linked Students",
    render: (parent) => (
      <span className="text-neutral-600">
        {parent.students.length ? parent.students.join(", ") : "Not linked"}
      </span>
    ),
  },
  {
    key: "phone",
    header: "Phone",
    sortValue: (parent) => parent.phone,
    render: (parent) => <span className="text-neutral-500">{parent.phone}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (parent) => parent.status,
    render: (parent) => <StatusBadge status={parent.status} />,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: () => (
      <RowActions
        actions={[
          { label: "View profile", icon: <UserPlusIcon className="size-3.5" /> },
          { label: "Send SMS", icon: <MailIcon className="size-3.5" /> },
          { label: "Edit details", icon: <PhoneIcon className="size-3.5" /> },
        ]}
      />
    ),
  },
];

export function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.PARENT_CREATE);

  const load = useCallback(async () => {
    try {
      const records = await parentApi.list();
      setParents(
        records.map((r) => ({
          id: r.id,
          name: r.name,
          students: r.students ?? [],
          phone: r.phone,
          email: r.email ?? "",
          status: toStatus(r.status),
        })),
      );
    } catch {
      setParents([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: AddParentValues): Promise<boolean> => {
    try {
      const record = await parentApi.create({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        status: toApiStatus(values.status),
        studentNames: values.students
          .split(",")
          .map((student) => student.trim())
          .filter(Boolean),
      });
      setParents((current) => [
        {
          id: record.id,
          name: record.name,
          students: record.students ?? [],
          phone: record.phone,
          email: record.email ?? "",
          status: toStatus(record.status),
        },
        ...current,
      ]);
      setDialogOpen(false);
      toast.success("Parent added successfully.");
      return true;
    } catch {
      return false;
    }
  };

  const table = useTable<Parent>({
    data: parents,
    pageSize: 8,
    getSearchText: (parent) =>
      `${parent.name} ${parent.students.join(" ")} ${parent.email} ${parent.phone}`,
    filterMatch: (parent, value) => parent.status === value,
    sortValue: (parent, key) => String(parent[key as keyof Parent] ?? ""),
    defaultSortKey: "name",
  });

  const pending = parents.filter((parent) => parent.status === "Pending").length;
  const linkedStudents = parents.reduce((sum, parent) => sum + parent.students.length, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Parents"
        description="Guardian accounts linked to student records"
        actions={
          canCreate ? (
            <Button
              text="Add Parent"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Guardians"
          value={String(parents.length)}
          delta="2 added this week"
          icon={<HeartHandshakeIcon className="size-4" />}
        />
        <StatsCard
          label="Linked Students"
          value={String(linkedStudents)}
          delta="Across all grades"
          deltaDirection="neutral"
          icon={<UserPlusIcon className="size-4" />}
        />
        <StatsCard
          label="Pending Verification"
          value={String(pending)}
          delta="Needs phone confirmation"
          deltaDirection="neutral"
          icon={<MailIcon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by status"
          options={STATUS_FILTERS}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search parents…" />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(parent) => parent.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No parents found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="guardians"
          />
        }
      />

      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Parent"
          description="Create a guardian account linked to student records."
        >
          <AddParentForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
        </Dialog>
      )}
    </div>
  );
}
