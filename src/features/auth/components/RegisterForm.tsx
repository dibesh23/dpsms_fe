"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Building2Icon,
  UserIcon,
  LockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  LoadingSpinner,
} from "@/shared/components/ui/icons";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { saveLastSchool } from "../../../shared/lib/schoolStorage";

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

const RegisterSchoolSchema = z
  .object({
    schoolName: z
      .string()
      .trim()
      .min(2, "School name is required")
      .max(255, "School name too long"),
    subdomain: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(63, "Too long")
      .regex(SUBDOMAIN_PATTERN, "Use lowercase letters, numbers, and hyphens only"),
    fullName: z.string().trim().min(1, "Admin name is required").max(255, "Name too long"),
    email: z.email("Enter a valid email address").trim(),
    password: z.string().min(8, "At least 8 characters").max(128, "Password too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterSchoolValues = z.infer<typeof RegisterSchoolSchema>;
type SubdomainStatus = "idle" | "checking" | "available" | "taken";
type PasswordStrength = 0 | 1 | 2 | 3;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function strengthOf(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 3) as PasswordStrength;
}

const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  0: "",
  1: "Weak",
  2: "Good",
  3: "Strong",
};

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  0: "bg-neutral-200",
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-emerald-500",
};

const REGISTER_INPUT_CLASS =
  "h-12 max-w-none rounded-xl border-stone-200 bg-stone-50/70 px-4 shadow-[0_1px_2px_rgba(0,0,0,.03)] transition-colors placeholder:text-stone-400 hover:border-stone-300 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100";

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-default text-white shadow-[0_8px_20px_rgba(6,78,59,.16)]">
        {icon}
      </span>
      <div>
        <h2 className="type-section-title leading-tight">{title}</h2>
        {description && <p className="type-body-secondary mt-1 max-w-xs">{description}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="type-label mb-2 block font-semibold text-content-emphasis">{label}</label>
      {children}
      {!error && hint ? <span className="type-helper mt-2 block">{hint}</span> : null}
    </div>
  );
}

export function RegisterForm() {
  const { registerSchool } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>("idle");
  const lastAutoSubdomain = useRef<string>("");
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchoolValues>({
    resolver: zodResolver(RegisterSchoolSchema),
    defaultValues: { subdomain: "" },
  });

  const watchedSchoolName = watch("schoolName") ?? "";
  const watchedSubdomain = watch("subdomain") ?? "";
  const watchedPassword = watch("password") ?? "";

  const strength = useMemo<PasswordStrength>(() => strengthOf(watchedPassword), [watchedPassword]);

  useEffect(() => {
    const slug = slugify(watchedSchoolName);
    if (!slug) return;
    const current = watchedSubdomain.trim();
    if (current && current !== lastAutoSubdomain.current) return;
    lastAutoSubdomain.current = slug;
    setValue("subdomain", slug);
  }, [watchedSchoolName, watchedSubdomain, setValue]);

  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    const subdomain = watchedSubdomain.trim();
    if (subdomain.length < 3 || !SUBDOMAIN_PATTERN.test(subdomain)) {
      setSubdomainStatus("idle");
      return;
    }
    setSubdomainStatus("checking");
    checkTimer.current = setTimeout(async () => {
      try {
        const available = await authApi.checkSubdomain(subdomain);
        setSubdomainStatus(available ? "available" : "taken");
      } catch {
        setSubdomainStatus("idle");
      }
    }, 500);
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [watchedSubdomain]);

  const onSubmit = async (values: RegisterSchoolValues) => {
    setApiError(null);
    try {
      const result = await registerSchool({
        schoolName: values.schoolName,
        subdomain: values.subdomain,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      saveLastSchool({
        tenantId: result.tenantId,
        subdomain: result.subdomain,
        name: result.schoolName,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Registration failed. Please try again.";
      setApiError(msg);
      if (msg.toLowerCase().includes("subdomain") && watchedSubdomain.trim()) {
        setSubdomainStatus("taken");
      }
    }
  };

  const subdomainTaken = subdomainStatus === "taken";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full overflow-hidden rounded-[28px] border border-stone-200 bg-white/95 shadow-[0_24px_80px_rgba(6,78,59,.10),0_2px_8px_rgba(28,25,23,.05)] ring-1 ring-emerald-950/5 backdrop-blur"
    >
      <section className="grid gap-7 border-b border-stone-200 p-6 sm:p-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 lg:p-10">
        <div>
          <SectionHeading
            icon={<Building2Icon className="size-5" />}
            title="School identity"
            description="The name and address your school community will recognize."
          />
          <div className="mt-6 hidden rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 lg:block">
            <p className="type-micro-label text-brand-default">Workspace preview</p>
            <p className="type-body mt-2 truncate font-semibold text-content-emphasis">
              {watchedSchoolName || "Your school name"}
            </p>
            <p className="type-caption mt-1 truncate text-emerald-700">
              {watchedSubdomain || "your-school"}.dpsms.app
            </p>
          </div>
        </div>

        <div className="grid content-start gap-6 md:grid-cols-2">
          <Field label="School name" error={errors.schoolName?.message}>
            <Input
              className={REGISTER_INPUT_CLASS}
              type="text"
              autoComplete="organization"
              placeholder="Shree Pathshala Secondary School"
              autoFocus
              disabled={isSubmitting}
              error={errors.schoolName?.message}
              {...register("schoolName")}
            />
          </Field>

          <Field
            label="School web address"
            hint={
              subdomainStatus === "checking" ? (
                <span className="inline-flex items-center gap-1.5">
                  <LoadingSpinner className="size-3.5" /> Checking availability…
                </span>
              ) : subdomainStatus === "available" ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                  <CheckCircle2Icon className="size-3.5" /> Available for your school
                </span>
              ) : subdomainStatus === "taken" ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
                  <AlertTriangleIcon className="size-3.5" /> This address is already taken
                </span>
              ) : (
                "Lowercase letters, numbers, and hyphens only."
              )
            }
            error={errors.subdomain?.message}
          >
            <div className="relative">
              <Input
                className={`${REGISTER_INPUT_CLASS} pr-28`}
                type="text"
                autoComplete="off"
                placeholder="your-school"
                disabled={isSubmitting}
                error={errors.subdomain?.message}
                {...register("subdomain")}
              />
              <span
                className={cn(
                  "type-caption pointer-events-none absolute inset-y-0 right-4 flex items-center font-medium",
                  subdomainStatus === "taken"
                    ? "text-red-500"
                    : subdomainStatus === "available"
                      ? "text-emerald-700"
                      : "text-stone-400",
                )}
              >
                .dpsms.app
              </span>
            </div>
          </Field>
        </div>
      </section>

      <section className="grid gap-7 border-b border-stone-200 bg-stone-50/45 p-6 sm:p-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 lg:p-10">
        <SectionHeading
          icon={<UserIcon className="size-5" />}
          title="Principal account"
          description="Your first administrator account with full workspace access."
        />

        <div className="grid content-start gap-6 md:grid-cols-2">
          <Field label="Full name" error={errors.fullName?.message}>
            <Input
              className={REGISTER_INPUT_CLASS}
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              disabled={isSubmitting}
              error={errors.fullName?.message}
              {...register("fullName")}
            />
          </Field>

          <Field label="Work email" hint="Used for secure sign-in." error={errors.email?.message}>
            <Input
              className={REGISTER_INPUT_CLASS}
              type="email"
              autoComplete="email"
              placeholder="principal@school.edu"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />
          </Field>

          <Field
            label="Password"
            error={errors.password?.message}
            hint={
              watchedPassword ? (
                <span className="inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    {[1, 2, 3].map((segment) => (
                      <span
                        key={segment}
                        className={cn(
                          "h-1.5 w-8 rounded-full transition-colors duration-300",
                          segment <= strength ? STRENGTH_COLORS[strength] : "bg-stone-200",
                        )}
                      />
                    ))}
                  </span>
                  <span className="font-medium">
                    {STRENGTH_LABELS[strength] || "At least 8 characters"}
                  </span>
                </span>
              ) : (
                "At least 8 characters."
              )
            }
          >
            <Input
              className={REGISTER_INPUT_CLASS}
              type="password"
              autoComplete="new-password"
              placeholder="Create a secure password"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <Input
              className={REGISTER_INPUT_CLASS}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              disabled={isSubmitting}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </Field>
        </div>
      </section>

      {apiError && (
        <div
          role="alert"
          className="mx-6 mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-8 lg:mx-10"
        >
          <AlertTriangleIcon className="mt-0.5 size-5 flex-none" />
          <p className="font-medium">{apiError}</p>
        </div>
      )}

      <footer className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 lg:px-10">
        <div className="flex items-start gap-3 text-content-subtle">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand-default">
            <LockIcon className="size-4" />
          </span>
          <div>
            <p className="type-body font-semibold text-content-emphasis">Secure by default</p>
            <p className="type-caption mt-0.5">
              Your school data stays private and role-protected.
            </p>
          </div>
        </div>
        <Button
          text={isSubmitting ? "Creating your workspace…" : "Create school workspace"}
          loading={isSubmitting}
          disabled={isSubmitting || subdomainTaken}
          className="h-12 w-full rounded-xl px-7 font-semibold shadow-[0_10px_24px_rgba(6,78,59,.18)] sm:w-auto"
        />
      </footer>
    </form>
  );
}
