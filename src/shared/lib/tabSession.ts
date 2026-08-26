// Per-tab refresh token storage. sessionStorage is isolated per browser tab,
// so each tab can hold its own session (e.g. admin + teacher + student portals
// open side by side) without the shared auth cookie overwriting it.
const STORAGE_KEY = "dpsms.tab_refresh_token";

export function getTabRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setTabRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
}

export function clearTabRefreshToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
