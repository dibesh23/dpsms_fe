"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { authApi } from "../api/authApi";
import { getLastSchool } from "../../../shared/lib/schoolStorage";

const ForgotSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  tenantId: z.uuid("Invalid tenant ID").optional(),
});
type ForgotFormValues = z.infer<typeof ForgotSchema>;

export function ForgotPasswordForm({
  defaultTenantId = "",
}: {
  defaultTenantId?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const knownTenantId = defaultTenantId || getLastSchool()?.tenantId || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { tenantId: knownTenantId },
  });

  const onSubmit = async ({ email, tenantId }: ForgotFormValues) => {
    try {
      await authApi.forgotPassword(email, tenantId || undefined);
    } catch {
      // deliberately swallow: never reveal whether an account exists
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-xl font-semibold">Check your inbox</h3>
        <p className="text-base font-medium text-neutral-500">
          If that email is registered, a reset link has been sent. Check your
          spam folder too.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full flex-col gap-y-6"
    >
      <label>
        <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
          Work email
        </span>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          autoFocus
          disabled={isSubmitting}
          error={errors.email?.message}
          {...register("email")}
        />
      </label>

      <input type="hidden" {...register("tenantId")} />

      <Button
        text={isSubmitting ? "Sending..." : "Send reset link"}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </form>
  );
}