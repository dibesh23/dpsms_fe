"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Field } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { Dialog } from "@/shared/components/ui/dialog";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { ArrowLeftIcon, LogOutIcon, MailIcon, PencilIcon, ShieldIcon } from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { formatDate } from "@/shared/lib/format";
import { profileApi, type ProfileRecord } from "../api/profileApi";

function roleLabel(role: ProfileRecord["role"]): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "PRINCIPAL":
      return "Principal";
    case "TEACHER":
      return "Teacher";
    case "STUDENT":
      return "Student";
    default:
      return role;
  }
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setFullName(data.fullName);
      setPhone(data.phone ?? "");
    } catch {
      setFullName(user?.fullName ?? "");
    }
    setDirty(false);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await profileApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      toast.success("Profile updated.");
      await load();
    } catch {
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setPasswordSubmitting(true);
    try {
      await profileApi.changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch {
      toast.error("Could not update your password. Please check your current password.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading && !profile) return <LoadingState label="Loading profile…" />;

  const role = profile?.role ?? "PRINCIPAL";
  const teacher = profile?.teacher ?? null;
  const student = profile?.student ?? null;

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to dashboard
      </Link>

      <PageHeader
        title="Profile"
        description="Manage your personal details and account security."
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main card */}
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={fullName || user?.fullName || "User"} size="lg" />
              <div>
                <p className="font-medium text-neutral-900">{fullName || user?.fullName || "User"}</p>
                <p className="mt-0.5 text-sm text-neutral-500">{profile?.school.name}</p>
                <div className="mt-2">
                  <StatusBadge status={roleLabel(role)} variant="info" dot={false} />
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              text="Edit"
              icon={<PencilIcon className="size-4" />}
              className="w-auto"
              disabled={!dirty}
              loading={saving}
              onClick={handleSave}
            />
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-neutral-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Full Name
              </dt>
              <dd className="mt-1">
                <Input
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setDirty(true);
                  }}
                  className="max-w-none"
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Phone
              </dt>
              <dd className="mt-1">
                <Input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Not set"
                  className="max-w-none"
                />
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Email
              </dt>
              <dd className="mt-1 flex items-center gap-2 break-all text-sm text-neutral-700">
                <MailIcon className="size-4 flex-none text-neutral-400" />
                {profile?.email || "—"}
              </dd>
            </div>
          </dl>

          {dirty && (
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                className="w-auto"
                onClick={() => void load()}
              />
              <Button
                text={saving ? "Saving…" : "Save Changes"}
                className="w-auto"
                loading={saving}
                onClick={handleSave}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Role-specific details */}
          {teacher && (
            <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Teacher Details</h3>
              <dl className="mt-3 space-y-3">
                {teacher.department && (
                  <DetailRow label="Department" value={teacher.department} />
                )}
                {teacher.employeeCode && (
                  <DetailRow label="Employee Code" value={teacher.employeeCode} />
                )}
                <DetailRow label="Classes / Week" value={String(teacher.classesPerWeek)} />
                {teacher.joinedAt && (
                  <DetailRow label="Joined" value={formatDate(teacher.joinedAt)} />
                )}
              </dl>
            </div>
          )}

          {student && (
            <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Student Details</h3>
              <dl className="mt-3 space-y-3">
                <DetailRow label="Admission No." value={student.admissionNumber} />
                {student.className && (
                  <DetailRow
                    label="Class"
                    value={
                      student.sectionName
                        ? `${student.className} — ${student.sectionName}`
                        : student.className
                    }
                  />
                )}
                {student.gender && (
                  <DetailRow
                    label="Gender"
                    value={student.gender.charAt(0) + student.gender.slice(1).toLowerCase()}
                  />
                )}
                {student.bloodGroup && (
                  <DetailRow label="Blood Group" value={student.bloodGroup} />
                )}
                {student.dateOfBirth && (
                  <DetailRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                )}
              </dl>
            </div>
          )}

          {/* Security */}
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <div className="flex items-center gap-2">
              <ShieldIcon className="size-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-900">Security</h3>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Your account is protected with a password used to sign in.
            </p>
            <Button
              variant="secondary"
              text="Change Password"
              className="mt-4 w-full"
              onClick={() => setPasswordOpen(true)}
            />
            <div className="mt-3 border-t border-neutral-100 pt-3">
              <Button
                variant="danger-outline"
                text="Log Out"
                icon={<LogOutIcon className="size-4" />}
                className="w-full"
                onClick={() => void logout().then(() => router.push("/login"))}
              />
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change Password"
        description="Enter your current password and choose a new one."
      >
        <div className="space-y-4">
          <Field label="Current Password">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New Password" hint="At least 8 characters.">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm New Password">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button
              variant="secondary"
              text="Cancel"
              className="w-auto"
              onClick={() => setPasswordOpen(false)}
            />
            <Button
              text={passwordSubmitting ? "Updating…" : "Update Password"}
              className="w-auto"
              loading={passwordSubmitting}
              onClick={handleChangePassword}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-neutral-700">{value || "—"}</dd>
    </div>
  );
}

export default ProfilePage;
