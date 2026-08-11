"use client";

import { useMemo, useState } from "react";
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
import { formatDate } from "@/shared/lib/format";
import { AddStaffForm, type AddStaffValues } from "./AddStaffForm";
import {
  BriefcaseIcon,
  ClockIcon,
  FileTextIcon,
  MailIcon,
  PlusIcon,
  UserPlusIcon,
} from "@/shared/components/ui/icons";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  status: "Active" | "On Leave" | "Resigned";
  joinedAt: string;
}

const STAFF: StaffMember[] = [
  {
    id: "st-01",
    name: "Suresh Rana",
    role: "Accountant",
    department: "Administration",
    email: "suresh.rana@pathshala.edu.np",
    status: "Active",
    joinedAt: "2019-02-11",
  },
  {
    id: "st-02",
    name: "Rita Kunwar",
    role: "Office Manager",
    department: "Administration",
    email: "rita.kunwar@pathshala.edu.np",
    status: "Active",
    joinedAt: "2020-08-03",
  },
  {
    id: "st-03",
    name: "Deepak Lama",
    role: "Librarian",
    department: "Library",
    email: "deepak.lama@pathshala.edu.np",
    status: "Active",
    joinedAt: "2021-01-19",
  },
  {
    id: "st-04",
    name: "Sabita Joshi",
    role: "Lab Assistant",
    department: "Science & Math",
    email: "sabita.joshi@pathshala.edu.np",
    status: "On Leave",
    joinedAt: "2021-07-12",
  },
  {
    id: "st-05",
    name: "Gopal Bhandari",
    role: "IT Support",
    department: "Administration",
    email: "gopal.bhandari@pathshala.edu.np",
    status: "Active",
    joinedAt: "2022-03-28",
  },
  {
    id: "st-06",
    name: "Kiran Magar",
    role: "Groundskeeper",
    department: "Facilities",
    email: "kiran.magar@pathshala.edu.np",
    status: "Active",
    joinedAt: "2018-11-05",
  },
  {
    id: "st-07",
    name: "Sunita Gurung",
    role: "Admin Officer",
    department: "Administration",
    email: "sunita.gurung@pathshala.edu.np",
    status: "Resigned",
    joinedAt: "2019-09-23",
  },
  {
    id: "st-08",
    name: "Bimal Shrestha",
    role: "Transport Coordinator",
    department: "Transport",
    email: "bimal.shrestha@pathshala.edu.np",
    status: "Active",
    joinedAt: "2023-04-17",
  },
];

const DEPARTMENT_FILTERS = [
  { value: "Administration", label: "Administration" },
  { value: "Library", label: "Library" },
  { value: "Science & Math", label: "Science & Math" },
  { value: "Facilities", label: "Facilities" },
  { value: "Transport", label: "Transport" },
];

const COLUMNS: Column<StaffMember>[] = [
  {
    key: "name",
    header: "Staff",
    sortValue: (member) => member.name,
    render: (member) => (
      <div className="flex items-center gap-3">
        <Avatar name={member.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{member.name}</p>
          <p className="text-xs text-neutral-400">{member.role}</p>
        </div>
      </div>
    ),
  },
  {
    key: "department",
    header: "Department",
    sortValue: (member) => member.department,
    render: (member) => <span className="text-neutral-600">{member.department}</span>,
  },
  {
    key: "email",
    header: "Email",
    sortValue: (member) => member.email,
    render: (member) => <span className="text-neutral-500">{member.email}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (member) => member.status,
    render: (member) => <StatusBadge status={member.status} />,
  },
  {
    key: "joinedAt",
    header: "Joined",
    sortValue: (member) => member.joinedAt,
    render: (member) => <span className="text-neutral-500">{formatDate(member.joinedAt)}</span>,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: () => (
      <RowActions
        actions={[
          { label: "View profile", icon: <UserPlusIcon className="size-3.5" /> },
          { label: "Send email", icon: <MailIcon className="size-3.5" /> },
          { label: "Edit details", icon: <FileTextIcon className="size-3.5" /> },
        ]}
      />
    ),
  },
];

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(STAFF);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = (values: AddStaffValues) => {
    const record: StaffMember = {
      id: `st-${String(staff.length + 1).padStart(2, "0")}`,
      name: values.fullName,
      role: values.role,
      department: values.department,
      email: values.email,
      status: values.status,
      joinedAt: values.joinedAt,
    };
    setStaff((current) => [record, ...current]);
    setDialogOpen(false);
  };

  const table = useTable<StaffMember>({
    data: staff,
    pageSize: 8,
    getSearchText: (member) => `${member.name} ${member.role} ${member.department} ${member.email}`,
    filterMatch: (member, value) => member.department === value,
    sortValue: (member, key) => String(member[key as keyof StaffMember] ?? ""),
    defaultSortKey: "name",
  });

  const departments = useMemo(
    () => new Set(staff.map((member) => member.department)).size,
    [staff],
  );
  const onLeave = staff.filter((member) => member.status === "On Leave").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff"
        description="Non-teaching staff across departments"
        actions={
          <Button
            text="Add Staff"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Staff"
          value={String(staff.length)}
          delta="2 added this term"
          icon={<BriefcaseIcon className="size-4" />}
        />
        <StatsCard
          label="Departments"
          value={String(departments)}
          delta="Fully staffed"
          deltaDirection="neutral"
          icon={<FileTextIcon className="size-4" />}
        />
        <StatsCard
          label="On Leave Today"
          value={String(onLeave)}
          delta="0 open shifts"
          deltaDirection="neutral"
          icon={<ClockIcon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by department"
          options={DEPARTMENT_FILTERS}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search staff…" />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(member) => member.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No staff found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="staff"
          />
        }
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Staff"
        description="Add a non-teaching staff member."
      >
        <AddStaffForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
