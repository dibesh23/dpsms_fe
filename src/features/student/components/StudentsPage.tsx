"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { AddStudentForm, type AddStudentValues } from "./AddStudentForm";
import { StudentCredentialsDialog } from "./StudentCredentialsDialog";
import { studentApi } from "../api/studentApi";
import { MailIcon, PlusIcon, UserPlusIcon, FileTextIcon } from "@/shared/components/ui/icons";

export interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  email: string;
  grade: string;
  status: "Active" | "Inactive" | "On Leave";
  enrolledAt: string;
}

const STATUS_FILTERS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "On Leave", label: "On Leave" },
];

const toStatus = (status: string): Student["status"] => {
  if (status === "ON_LEAVE") return "On Leave";
  return status === "INACTIVE" ? "Inactive" : "Active";
};

const COLUMNS: Column<Student>[] = [
  {
    key: "name",
    header: "Student",
    sortValue: (student) => student.name,
    render: (student) => (
      <div className="flex items-center gap-3">
        <Avatar name={student.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{student.name}</p>
          <p className="text-xs text-neutral-400">Adm. {student.admissionNumber}</p>
        </div>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortValue: (student) => student.email,
    render: (student) => <span className="text-neutral-500">{student.email}</span>,
  },
  {
    key: "grade",
    header: "Grade",
    sortValue: (student) => student.grade,
    render: (student) => <span className="font-medium text-neutral-700">{student.grade}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (student) => student.status,
    render: (student) => <StatusBadge status={student.status} />,
  },
  {
    key: "enrolledAt",
    header: "Enrollment Date",
    sortValue: (student) => student.enrolledAt,
    render: (student) => <span className="text-neutral-500">{formatDate(student.enrolledAt)}</span>,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: () => (
      <RowActions
        actions={[
          { label: "View profile", href: "/students", icon: <UserPlusIcon className="size-3.5" /> },
          { label: "Edit details", icon: <FileTextIcon className="size-3.5" /> },
          { label: "Send email", icon: <MailIcon className="size-3.5" /> },
          { label: "Remove", danger: true, icon: <FileTextIcon className="size-3.5" /> },
        ]}
      />
    ),
  },
];

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<{
    name: string;
    admissionNumber: string;
    email: string;
    password: string;
  } | null>(null);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.STUDENT_CREATE);

  const load = useCallback(async () => {
    try {
      const records = await studentApi.list();
      setStudents(
        records.map((r) => ({
          id: r.id,
          admissionNumber: r.admissionNumber,
          name: r.name,
          email: r.email ?? "",
          grade: r.grade,
          status: toStatus(r.status),
          enrolledAt: r.enrolledAt,
        })),
      );
    } catch {
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: AddStudentValues): Promise<string | null> => {
    try {
      const record = await studentApi.create({
        fullName: values.fullName,
        email: values.email,
        grade: values.grade,
        status: (values.status === "On Leave" ? "ON_LEAVE" : values.status.toUpperCase()) as
          | "ACTIVE"
          | "INACTIVE"
          | "ON_LEAVE",
        admissionDate: values.enrolledAt,
      });
      setStudents((current) => [
        {
          id: record.id,
          admissionNumber: record.admissionNumber,
          name: record.name,
          email: record.email ?? "",
          grade: record.grade,
          status: toStatus(record.status),
          enrolledAt: record.enrolledAt,
        },
        ...current,
      ]);
      setDialogOpen(false);
      if (record.credentials) {
        setCredentials({
          name: record.name,
          admissionNumber: record.admissionNumber,
          email: record.credentials.email,
          password: record.credentials.password,
        });
      } else {
        toast.success("Student added successfully.");
      }
      return null;
    } catch (err) {
      if (err instanceof Error && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } })
          .response;
        const message = response?.data?.error?.message;
        if (message) return message;
      }
      return "Could not add the student. Check the details and try again.";
    }
  };

  const handleCredentialsAcknowledged = useCallback(() => {
    setCredentials(null);
    toast.success("Student added successfully.");
  }, [toast]);

  const table = useTable<Student>({
    data: students,
    pageSize: 8,
    getSearchText: (student) => `${student.name} ${student.email} ${student.grade}`,
    filterMatch: (student, value) => student.status === value,
    sortValue: (student, key) => String(student[key as keyof Student] ?? ""),
    defaultSortKey: "name",
  });

  const filters = useMemo(
    () =>
      STATUS_FILTERS.map((option) => ({
        ...option,
        label: `${option.label} (${students.filter((s) => s.status === option.value).length})`,
      })),
    [students],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        description={`${students.length} records · Admissions for the 2082/83 academic year`}
        actions={
          canCreate ? (
            <Button
              text="Add Student"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by status"
          options={filters}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search students…" />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(student) => student.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No students found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="students"
          />
        }
      />

      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Student"
          description="Enrol a new student."
        >
          <AddStudentForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
        </Dialog>
      )}

      <StudentCredentialsDialog
        open={credentials !== null}
        name={credentials?.name ?? ""}
        admissionNumber={credentials?.admissionNumber ?? ""}
        email={credentials?.email ?? ""}
        password={credentials?.password ?? ""}
        onAcknowledged={handleCredentialsAcknowledged}
      />
    </div>
  );
}
