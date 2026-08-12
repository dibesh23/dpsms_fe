"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Field } from "@/shared/components/ui/form-field";
import { Input } from "@/shared/components/ui/input";
import { Dialog } from "@/shared/components/ui/dialog";
import { profileApi } from "../api/profileApi";
import {
  BanIcon,
  BellIcon,
  BookUserIcon,
  CreditCardIcon,
  GroupIcon,
  LayoutGridIcon,
  MenuIcon,
  PhoneIcon,
  PlugIcon,
  ShareIcon,
  SlidersIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "@/shared/components/ui/icons";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/components/ui/toast";

type SettingsItem = {
  label: string;
  icon: typeof UserIcon;
};

const YOUR_ACCOUNT: SettingsItem[] = [
  { label: "Profile", icon: UserIcon },
  { label: "Preferences", icon: SlidersIcon },
  { label: "Notifications", icon: BellIcon },
  { label: "Referrals", icon: ShareIcon },
  { label: "Blocklist", icon: BanIcon },
];

const WORKSPACE: SettingsItem[] = [
  { label: "General", icon: LayoutGridIcon },
  { label: "Members", icon: UsersIcon },
  { label: "Groups", icon: GroupIcon },
  { label: "Phone numbers", icon: PhoneIcon },
  { label: "Integrations", icon: PlugIcon },
  { label: "Plan & billing", icon: CreditCardIcon },
  { label: "Contacts", icon: BookUserIcon },
];

function SettingsLink({
  active,
  icon: Icon,
  label,
  onNavigate,
}: {
  active?: boolean;
  icon: typeof UserIcon;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-bg-subtle font-medium text-neutral-900"
          : "text-neutral-500 hover:bg-bg-subtle/70 hover:text-neutral-900",
      )}
    >
      <Icon
        className={cn(
          "size-4 flex-none",
          active ? "text-neutral-900" : "text-neutral-400",
        )}
      />
      {label}
    </button>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [activeItem, setActiveItem] = useState("Profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await profileApi.getProfile();
      const parts = profile.fullName.split(/\s+/);
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
      setEmail(profile.email);
      setPhone(profile.phone ?? "");
    } catch {
      setFirstName(user?.fullName?.split(/\s+/)[0] ?? "");
      setLastName(user?.fullName?.split(/\s+/).slice(1).join(" ") ?? "");
      setEmail(user?.email ?? "");
      setPhone("");
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleNavigate = (label: string) => {
    setActiveItem(label);
    setSidebarOpen(false);
    if (label === "Profile") return;
    router.push("/dashboard");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    void load();
    setAvatarUrl(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      await profileApi.updateProfile({ fullName, phone: phone || undefined });
      toast.success("Profile updated.");
    } catch {
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordSubmitting(true);
    setPasswordError(null);
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch {
      toast.error(
        "Could not update your password. Please check your current password.",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="animate-rise">
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <ProfilePageHeader />
        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Open settings menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition-colors hover:bg-bg-muted"
        >
          <MenuIcon className="size-4" />
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-900/40 animate-overlay-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-bg-default shadow-xl animate-drawer-in">
            <div className="flex h-14 flex-none items-center justify-end border-b border-neutral-100 pr-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close settings menu"
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-bg-subtle hover:text-neutral-700"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SettingsNav
                activeItem={activeItem}
                onNavigate={handleNavigate}
                user={user}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-0">
        <aside className="hidden w-60 shrink-0 border-r border-neutral-200 pr-8 lg:block">
          <SettingsNav activeItem={activeItem} onNavigate={handleNavigate} user={user} />
        </aside>

        <div className="min-w-0 flex-1 lg:pl-10">
          <div className="hidden lg:block">
            <ProfilePageHeader />
          </div>

          <div className="mt-8 lg:mt-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Your profile"
                  className="h-16 w-16 flex-none rounded-full object-cover"
                />
              ) : (
                <Avatar name={user?.fullName ?? "User"} size="lg" className="h-16 w-16 text-lg" />
              )}

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Profile Picture
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    text="Upload Image"
                    variant="secondary"
                    className="w-auto"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <Button
                    text="Remove"
                    variant="outline"
                    className="w-auto text-neutral-500 hover:text-red-600"
                    onClick={() => setAvatarUrl(null)}
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  Allowed formats: JPG, PNG, WEBP. Maximum file size 2MB.
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="mt-10">
            <h2 className="text-base font-medium text-neutral-900">
              Personal Information
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Your personal details. This information will be shown to other
              people in your workspace.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="First Name">
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="max-w-none"
                />
              </Field>
              <Field label="Last Name">
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="max-w-none"
                />
              </Field>
            </div>

            <div className="mt-5">
              <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                Email
              </span>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Input value={email} readOnly className="max-w-none" aria-label="Email" />
                </div>
                <Button
                  text="Edit Email"
                  variant="outline"
                  className="h-10 w-auto shrink-0 border-border-subtle bg-bg-default px-3 text-sm text-neutral-700 hover:bg-bg-muted"
                />
              </div>
              <p className="mt-1.5 text-sm text-neutral-400">
                This email is used for sign-in to your account.
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-neutral-200 pt-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-md">
                <h2 className="text-base font-semibold text-neutral-900">
                  Password
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Your account is secured with a password used to sign in. Reset
                  it at any time to keep your account safe.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="flex h-10 flex-none items-center justify-center rounded-lg border border-border-subtle bg-bg-default px-3 text-sm text-neutral-700 transition-colors hover:bg-bg-muted"
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-neutral-200 pt-6">
            <div className="flex items-center justify-end gap-2">
              <Button
                text="Cancel"
                variant="secondary"
                className="w-auto"
                onClick={handleCancel}
              />
              <Button
                text={saving ? "Saving…" : "Save"}
                className="w-auto"
                loading={saving}
                onClick={handleSave}
              />
</div>
        </div>

      <Dialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change Password"
        description="Enter your current password and a new one."
      >
        <div className="space-y-4">
          <Field label="Current Password">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New Password">
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
          <div className="flex justify-end gap-2 pt-2">
            <Button
              text="Cancel"
              variant="secondary"
              className="w-auto"
              onClick={() => setPasswordOpen(false)}
            />
            <Button
              text={passwordSubmitting ? "Updating…" : "Save"}
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

function ProfilePageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Account
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage your account settings, profile, and preferences.
      </p>
    </div>
  );
}

function SettingsNav({
  activeItem,
  onNavigate,
  user,
}: {
  activeItem: string;
  onNavigate?: (label: string) => void;
  user: { fullName?: string | null; email?: string | null } | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-neutral-100 pb-6 pt-2">
        <Avatar name={user?.fullName ?? "User"} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">
            {user?.fullName ?? "User"}
          </p>
          <p className="truncate text-xs text-neutral-500">{user?.email}</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="px-3 pb-2 text-xs font-medium tracking-wider text-neutral-400 uppercase">
          Your account
        </p>
        <ul className="space-y-0.5">
          {YOUR_ACCOUNT.map((item) => (
            <li key={item.label}>
              <SettingsLink
                active={activeItem === item.label}
                icon={item.icon}
                label={item.label}
                onNavigate={() => onNavigate?.(item.label)}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <p className="px-3 pb-2 text-xs font-medium tracking-wider text-neutral-400 uppercase">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {WORKSPACE.map((item) => (
            <li key={item.label}>
              <SettingsLink
                active={activeItem === item.label}
                icon={item.icon}
                label={item.label}
                onNavigate={() => onNavigate?.(item.label)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProfilePage;