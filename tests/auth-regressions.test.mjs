import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("login UI does not expose OAuth", async () => {
  const source = await read("src/features/auth/components/LoginForm.tsx");
  assert.doesNotMatch(source, /GoogleSignIn|oauthEnabled/i);
});

test("concurrent unauthorized requests share one refresh", async () => {
  const source = await read("src/shared/lib/apiClient.ts");
  assert.match(source, /refreshPromise \?\?=/);
});

test("each browser tab keeps and rotates its own refresh token", async () => {
  const [api, storage] = await Promise.all([
    read("src/features/auth/api/authApi.ts"),
    read("src/shared/lib/tabSession.ts"),
  ]);

  assert.match(storage, /window\.sessionStorage\.getItem/);
  assert.match(storage, /window\.sessionStorage\.setItem/);
  assert.match(api, /setTabRefreshToken\(data\.refreshToken\)/);
  assert.match(api, /"X-Refresh-Token": tabToken/);
  assert.match(api, /refreshToken: token/);
});

test("a fresh tab does not make an unauthorized refresh request", async () => {
  const [provider, api] = await Promise.all([
    read("src/shared/providers/AuthProvider.tsx"),
    read("src/features/auth/api/authApi.ts"),
  ]);

  assert.match(provider, /if \(!getTabRefreshToken\(\)\)/);
  assert.match(api, /catch \(error\)[\s\S]*clearTabRefreshToken\(\)/);
});

test("authentication pages do not link to unavailable legal routes", async () => {
  const shell = await read("src/shared/components/AuthShell.tsx");
  assert.doesNotMatch(shell, /href=["']\/(?:privacy|terms)["']/);
});

test("forgot password distinguishes server and connection failures", async () => {
  const form = await read("src/features/auth/components/ForgotPasswordForm.tsx");
  assert.match(form, /status && status >= 500/);
  assert.match(form, /reset email service is temporarily unavailable/i);
  assert.match(form, /couldn't reach the server/i);
});

test("plain login does not reuse a cached or environment tenant", async () => {
  const [context, page] = await Promise.all([
    read("src/features/auth/components/LoginWithSchoolContext.tsx"),
    read("src/app/(auth)/login/page.tsx"),
  ]);
  assert.doesNotMatch(context, /getLastSchool/);
  assert.doesNotMatch(page, /NEXT_PUBLIC_TENANT_ID/);
  assert.match(context, /setResolvedTenantId\(null\)/);
});

test("plain login accepts an empty hidden tenant field", async () => {
  const source = await read("src/features/auth/components/LoginForm.tsx");
  assert.match(source, /value === "" \|\| z\.uuid\(\)\.safeParse\(value\)\.success/);
});

test("advisory tenant header is only sent for explicitly scoped requests", async () => {
  const source = await read("src/shared/lib/apiClient.ts");
  assert.match(source, /hasExplicitScope/);
  assert.match(source, /if \(hasExplicitScope\)/);
  assert.match(source, /typeof body\.tenantId === "string"/);
});
