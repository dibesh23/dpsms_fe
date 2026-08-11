"use client";

import { useState } from "react";
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
import { AddParentForm, type AddParentValues } from "./AddParentForm";
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

const PARENTS: Parent[] = [
  {
    id: "p-01",
    name: "Hari Sharma",
    students: ["Aarav Sharma"],
    phone: "9841-889900",
    email: "hari.sharma@gmail.com",
    status: "Verified",
  },
  {
    id: "p-02",
    name: "Mina Rai",
    students: ["Sita Rai", "Sunita Rai"],
    phone: "9851-445566",
    email: "mina.rai@gmail.com",
    status: "Verified",
  },
  {
    id: "p-03",
    name: "Dawa Gurung",
    students: ["Bibek Gurung"],
    phone: "9803-112233",
    email: "dawa.gurung@gmail.com",
    status: "Pending",
  },
  {
    id: "p-04",
    name: "Pramila Shrestha",
    students: ["Anisha Shrestha", "Sujan Shrestha"],
    phone: "9860-778899",
    email: "pramila.shrestha@gmail.com",
    status: "Verified",
  },
  {
    id: "p-05",
    name: "Kamal Karki",
    students: ["Rohan Karki"],
    phone: "9849-554433",
    email: "kamal.karki@gmail.com",
    status: "Verified",
  },
  {
    id: "p-06",
    name: "Keshav Maharjan",
    students: ["Prativa Maharjan"],
    phone: "9851-667788",
    email: "keshav.maharjan@gmail.com",
    status: "Pending",
  },
  {
    id: "p-07",
    name: "Laxmi Thapa",
    students: ["Sagar Thapa"],
    phone: "9812-345678",
    email: "laxmi.thapa@gmail.com",
    status: "Verified",
  },
  {
    id: "p-08",
    name: "Ramesh Tamang",
    students: ["Nisha Tamang"],
    phone: "9843-221100",
    email: "ramesh.tamang@gmail.com",
    status: "Verified",
  },
  {
    id: "p-09",
    name: "Sabina Adhikari",
    students: ["Dipesh Adhikari"],
    phone: "9808-998877",
    email: "sabina.adhikari@gmail.com",
    status: "Pending",
  },
  {
    id: "p-10",
    name: "Prakash Basnet",
    students: ["Kritika Basnet"],
    phone: "9861-223344",
    email: "prakash.basnet@gmail.com",
    status: "Verified",
  },
];

const STATUS_FILTERS = [
  { value: "Verified", label: "Verified" },
  { value: "Pending", label: "Pending" },
];

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
    render: (parent) => <span className="text-neutral-600">{parent.students.join(", ")}</span>,
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
  const [parents, setParents] = useState<Parent[]>(PARENTS);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = (values: AddParentValues) => {
    const record: Parent = {
      id: `p-${String(parents.length + 1).padStart(2, "0")}`,
      name: values.fullName,
      students: values.students
        .split(",")
        .map((student) => student.trim())
        .filter(Boolean),
      phone: values.phone,
      email: values.email,
      status: values.status,
    };
    setParents((current) => [record, ...current]);
    setDialogOpen(false);
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
          <Button
            text="Add Parent"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Parent"
        description="Create a guardian account linked to student records."
      >
        <AddParentForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
