"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/shared/components/ui/icons";
import { authApi } from "../api/authApi";
import { LoginForm } from "./LoginForm";
import { getLastSchool, saveLastSchool } from "../../../shared/lib/schoolStorage";
import type { RoleName } from "../types";

const ROLE_FROM_PARAM: Record<string, RoleName | undefined> = {
  admin: "PRINCIPAL",
  employee: "TEACHER",
  student: "STUDENT",
};

export function LoginWithSchoolContext({
  defaultTenantId,
  oauthEnabled,
}: {
  defaultTenantId: string;
  oauthEnabled: boolean;
}) {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const subdomain = searchParams.get("subdomain");
  const tenantIdParam = searchParams.get("tenantId");
  const roleParam = searchParams.get("role");
  const oauthError = searchParams.get("oauth_error");

  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(() =>
    tenantIdParam
      ? tenantIdParam
      : (getLastSchool()?.tenantId ?? null),
  );
  const [resolving, setResolving] = useState(
    !tenantIdParam && !!subdomain,
  );
  const [schoolName, setSchoolName] = useState<string | null>(() =>
    getLastSchool()?.name ?? null,
  );
  const [resolutionError, setResolutionError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (tenantIdParam) {
      setResolvedTenantId(tenantIdParam);
      setResolving(false);
      setResolutionError(null);
      return;
    }
    if (!subdomain) {
      setResolvedTenantId(getLastSchool()?.tenantId ?? (defaultTenantId || null));
      setResolving(false);
      return;
    }
    let cancelled = false;
    setResolving(true);
    setResolutionError(null);
    authApi
      .resolveTenant(subdomain)
      .then((tenant) => {
        if (cancelled) return;
        if (tenant) {
          setResolvedTenantId(tenant.tenantId);
          setSchoolName(tenant.name);
          setResolutionError(null);
          saveLastSchool({
            tenantId: tenant.tenantId,
            subdomain,
            name: tenant.name,
          });
        } else {
          setResolvedTenantId(getLastSchool()?.tenantId ?? (defaultTenantId || null));
          setResolutionError(
            "We couldn't find that school. Double-check the subdomain and try again.",
          );
        }
        setResolving(false);
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedTenantId(getLastSchool()?.tenantId ?? (defaultTenantId || null));
        setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subdomain, tenantIdParam, defaultTenantId]);

  return (
    <div className="flex w-full flex-col gap-3">
      {registered === "1" && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {schoolName
            ? `${schoolName} was created successfully. Log in with your admin account to get started.`
            : "Your school was created successfully. Log in with your admin account to get started."}
        </div>
      )}

      {oauthError && (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {oauthError}
        </div>
      )}

      {resolutionError && (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {resolutionError}
        </div>
      )}

{resolving ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500">
          <LoadingSpinner className="size-4" />
          Finding your school...
        </div>
      ) : (
        <LoginForm
          defaultTenantId={resolvedTenantId ?? defaultTenantId}
          schoolName={schoolName}
          defaultRole={roleParam ? ROLE_FROM_PARAM[roleParam] : undefined}
          oauthEnabled={oauthEnabled}
        />
      )}
    </div>
  );
}
