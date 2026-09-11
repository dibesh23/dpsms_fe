"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  EditStudentForm,
  apiStatusToLabel,
  editValuesToPayload,
  toDateInputValue,
  type EditStudentValues,
} from "./EditStudentForm";
import { CredentialsRevealDialog } from "@/shared/components/ui/credentials-reveal-dialog";
import { studentApi, type StudentDetailRecord } from "../api/studentApi";
import { PlusIcon, UserIcon, PencilIcon, TrashIcon } from "@/shared/components/ui/icons";

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

const toStudentRow = (r: {
  id: string;
  admissionNumber: string;
  name: string;
  email: string | null;
  grade: string;
  status: string;
  enrolledAt: string;
}): Student => ({
  id: r.id,
  admissionNumber: r.admissionNumber,
  name: r.name,
  email: r.email ?? "",
  grade: r.grade,
  status: toStatus(r.status),
  enrolledAt: r.enrolledAt,
});

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentDetailRecord | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [removing, setRemoving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenAdd = searchParams.get("add") === "1";
  const [credentials, setCredentials] = useState<{
    name: string;
    admissionNumber: string;
    email: string;
    password: string;
  } | null>(null);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.STUDENT_CREATE);
  const canUpdate = can(PERMISSIONS.STUDENT_UPDATE);
  const canDelete = can(PERMISSIONS.STUDENT_DELETE);
  const canTransfer = can(PERMISSIONS.STUDENT_TRANSFER);

  const load = useCallback(async () => {
    try {
      const records = await studentApi.list();
      setStudents(
        records.map((r) =>
          toStudentRow({
            id: r.id,
            admissionNumber: r.admissionNumber,
            name: r.name,
            email: r.email,
            grade: r.grade,
            status: r.status,
            enrolledAt: r.enrolledAt,
          }),
        ),
      );
    } catch {
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (shouldOpenAdd && canCreate) {
      setDialogOpen(true);
      router.replace("/students");
    }
  }, [shouldOpenAdd, canCreate, router]);

  const handleAdd = async (values: AddStudentValues): Promise<string | null> => {
    try {
      const record = await studentApi.create({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone?.trim() || undefined,
        gender: values.gender || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        bloodGroup: values.bloodGroup?.trim() || undefined,
        address: values.address?.trim() || undefined,
        grade: values.grade,
        section: values.section?.trim() || undefined,
        status: (values.status === "On Leave" ? "ON_LEAVE" : values.status.toUpperCase()) as
          "ACTIVE" | "INACTIVE" | "ON_LEAVE",
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

  const openEdit = async (student: Student) => {
    try {
      const detail = await studentApi.get(student.id);
      setEditTarget(detail);
    } catch {
      toast.error("Could not load this student's details. Try again.");
    }
  };

  const handleEdit = async (values: EditStudentValues): Promise<string | null> => {
    if (!editTarget) return "Could not save changes. Try again.";
    try {
      await studentApi.update(editTarget.id, editValuesToPayload(values));
      toast.success("Student updated successfully.");
      setEditTarget(null);
      await load();
      return null;
    } catch (err) {
      if (err instanceof Error && "response" in err) {
        const message = (err as { response?: { data?: { error?: { message?: string } } } }).response
          ?.data?.error?.message;
        if (message) return message;
      }
      return "Could not update the student. Check the details and try again.";
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await studentApi.remove(removeTarget.id);
      toast.success("Student removed successfully.");
      await load();
      setRemoveTarget(null);
    } catch {
      toast.error("Could not remove the student. Try again.");
    } finally {
      setRemoving(false);
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

  const columns = useMemo<Column<Student>[]>(
    () => [
      {
        key: "name",
        header: "Student",
        sortValue: (student) => student.name,
        render: (student) => (
          <div className="flex items-center gap-3">
            <Avatar name={student.name} size="sm" />
            <div className="min-w-0">
              <Link
                href={`/students/${student.id}`}
                className="truncate font-medium text-neutral-900 transition-colors hover:underline"
              >
                {student.name}
              </Link>
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
        render: (student) => (
          <span className="text-neutral-500">{formatDate(student.enrolledAt)}</span>
        ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: (student) => (
          <RowActions
            actions={[
              {
                label: "View profile",
                href: `/students/${student.id}`,
                icon: <UserIcon className="size-3.5" />,
              },
              ...(canUpdate
                ? [
                    {
                      label: "Edit details",
                      icon: <PencilIcon className="size-3.5" />,
                      onClick: () => void openEdit(student),
                    },
                  ]
                : []),
              ...(canTransfer
                ? [
                    {
                      label: "Transfer section",
                      href: `/students/${student.id}?transfer=1`,
                    },
                  ]
                : []),
              ...(canDelete
                ? [
                    {
                      label: "Remove",
                      danger: true,
                      icon: <TrashIcon className="size-3.5" />,
                      onClick: () => setRemoveTarget(student),
                    },
                  ]
                : []),
            ]}
          />
        ),
      },
    ],

    [canUpdate, canDelete, canTransfer, toast],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        description={`${students.length} records · Admissions for the current academic year`}
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
        columns={columns}
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

      {canUpdate && editTarget && (
        <Dialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          title="Edit Student"
          description={`Update ${editTarget.fullName}'s details. Class and section changes are done from the profile page.`}
          maxWidth="max-w-2xl"
        >
          <EditStudentForm
            initial={{
              fullName: editTarget.fullName,
              email: editTarget.email ?? "",
              phone: editTarget.phone ?? "",
              gender: editTarget.gender ?? "",
              dateOfBirth: toDateInputValue(editTarget.dateOfBirth),
              bloodGroup: editTarget.bloodGroup ?? "",
              address: editTarget.address ?? "",
              status: apiStatusToLabel(editTarget.status),
              admissionDate: toDateInputValue(editTarget.admissionDate),
            }}
            onSave={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        </Dialog>
      )}

      {canDelete && removeTarget && (
        <Dialog
          open={removeTarget !== null}
          onClose={() => setRemoveTarget(null)}
          title={`Remove ${removeTarget.name}?`}
          description="This action cannot be undone."
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              This will deactivate the student record ({removeTarget.admissionNumber}) and revoke
              their login access. Their past records stay intact.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setRemoveTarget(null)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={removing ? "Removing…" : "Remove"}
                loading={removing}
                disabled={removing}
                className="w-auto"
                onClick={() => void handleRemove()}
              />
            </div>
          </div>
        </Dialog>
      )}

      <CredentialsRevealDialog
        open={credentials !== null}
        personName={credentials?.name ?? ""}
        identifierLabel="Admission No."
        identifierValue={credentials?.admissionNumber}
        credentials={{
          email: credentials?.email ?? "",
          password: credentials?.password ?? "",
        }}
        personType="Student"
        slipFooter="Please keep this credential safe. Do not share it with anyone other than the student/guardian."
        onAcknowledged={handleCredentialsAcknowledged}
      />
    </div>
  );
}
