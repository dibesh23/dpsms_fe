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
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
        {icon}
      </span>
      <div>
        <h4 className="text-content-emphasis text-sm font-semibold leading-tight">{title}</h4>
        {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
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
    <div>
      <label className="type-label mb-2 block">{label}</label>
      {children}
      {!error && hint ? <span className="mt-2 block text-sm text-neutral-500">{hint}</span> : null}
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
    <div className="flex w-full flex-col gap-3">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full flex-col gap-y-8">
        <div className="flex flex-col gap-5">
          <SectionHeading
            icon={<Building2Icon className="size-5" />}
            title="School details"
            description="This creates a new school and a full set of roles."
          />

          <Field label="School name" error={errors.schoolName?.message}>
            <Input
              type="text"
              autoComplete="organization"
              placeholder="e.g. Shree Pathshala Secondary School"
              autoFocus
              disabled={isSubmitting}
              error={errors.schoolName?.message}
              {...register("schoolName")}
            />
          </Field>

          <Field
            label="Subdomain"
            hint={
              subdomainStatus === "checking" ? (
                <span className="inline-flex items-center gap-1.5">
                  <LoadingSpinner className="size-3.5" />
                  Checking availability...
                </span>
              ) : subdomainStatus === "available" ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2Icon className="size-3.5" />
                  <span>
                    Available —{" "}
                    <span className="font-medium">
                      {watchedSubdomain || "your-school"}.dpsms.app
                    </span>
                  </span>
                </span>
              ) : subdomainStatus === "taken" ? (
                <span className="inline-flex items-center gap-1.5 text-red-500">
                  <AlertTriangleIcon className="size-3.5" />
                  This subdomain is already taken.
                </span>
              ) : (
                <>This is your school&apos;s web address. You can change it before you finish.</>
              )
            }
            error={errors.subdomain?.message}
          >
            <div className="flex items-center gap-2">
              <Input
                type="text"
                autoComplete="off"
                placeholder="your-school"
                disabled={isSubmitting}
                error={errors.subdomain?.message}
                {...register("subdomain")}
              />
              <span
                className={cn(
                  "flex-none text-sm",
                  subdomainStatus === "taken"
                    ? "text-red-500"
                    : subdomainStatus === "available"
                      ? "text-emerald-600"
                      : "text-neutral-400",
                )}
              >
                .dpsms.app
              </span>
            </div>
          </Field>
        </div>

        <div className="flex flex-col gap-5">
          <SectionHeading
            icon={<UserIcon className="size-5" />}
            title="Admin account"
            description="This account will manage the school as Principal."
          />

          <Field label="Your full name" error={errors.fullName?.message}>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              disabled={isSubmitting}
              error={errors.fullName?.message}
              {...register("fullName")}
            />
          </Field>

          <Field
            label="Work email"
            hint="You'll log in with this email."
            error={errors.email?.message}
          >
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
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
                          "h-1 w-6 rounded-full transition-colors",
                          segment <= strength ? STRENGTH_COLORS[strength] : "bg-neutral-200",
                        )}
                      />
                    ))}
                  </span>
                  <span className={cn(strength >= 2 ? "text-neutral-600" : "text-neutral-500")}>
                    {STRENGTH_LABELS[strength] || "Min. 8 characters"}
                  </span>
                </span>
              ) : (
                "Min. 8 characters"
              )
            }
          >
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              disabled={isSubmitting}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </Field>
        </div>

        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertTriangleIcon className="mt-0.5 size-4 flex-none" />
            <p>{apiError}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            text={isSubmitting ? "Creating your school..." : "Create my school"}
            loading={isSubmitting}
            disabled={isSubmitting || subdomainTaken}
          />
          <p className="flex items-center gap-1.5 text-center text-xs text-neutral-500">
            <LockIcon className="size-3.5 flex-none" />
            Your data is protected and never shared.
          </p>
        </div>
      </form>
    </div>
  );
}
