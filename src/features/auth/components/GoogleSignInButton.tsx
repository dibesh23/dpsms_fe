"use client";

import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Google } from "@/shared/components/ui/icons";

interface GoogleSignInButtonProps {
  tenantId: string;
  label?: string;
}

export function GoogleSignInButton({
  tenantId,
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const handleClick = () => {
    if (!tenantId) {
      alert("School tenant is not configured. Contact your administrator.");
      return;
    }
    const apiBase =
      process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";
    window.location.href = `${apiBase}/api/auth/google?tenantId=${encodeURIComponent(tenantId)}`;
  };

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      icon={<Google className="size-4" />}
      text={label}
    />
  );
}