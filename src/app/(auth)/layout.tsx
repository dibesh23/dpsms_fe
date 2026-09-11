import React from "react";
import { AuthShell } from "../../shared/components/AuthShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
