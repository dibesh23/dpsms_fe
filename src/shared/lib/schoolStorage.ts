export interface SavedSchool {
  tenantId: string;
  subdomain?: string;
  name?: string;
}

const STORAGE_KEY = "dpsms.last_school";

export function getLastSchool(): SavedSchool | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSchool;
    return parsed && typeof parsed.tenantId === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLastSchool(school: SavedSchool): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(school));
  } catch {}
}
