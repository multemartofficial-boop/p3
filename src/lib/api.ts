// Demo build — there is no backend. Every call dispatches to the in-browser
// demo API (lib/demo-api.ts), which serves fictional data and persists
// mutations to localStorage. The public surface is unchanged.
import { demoApi, demoCsv, DemoApiError } from "./demo-api";

const TOKEN_KEY = "gt_token";
const USER_KEY = "gt_user";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
}

const isBrowser = typeof window !== "undefined";

export function getToken(): string | null {
  return isBrowser ? localStorage.getItem(TOKEN_KEY) : null;
}
export function getSessionUser(): SessionUser | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}
export function setSession(token: string, user: SessionUser) {
  if (!isBrowser) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  if (!isBrowser) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const bearer = () => {
  const t = getToken();
  return t ? `Bearer ${t}` : null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
    return (await demoApi(String(init?.method ?? "GET"), path, body, bearer())) as T;
  } catch (err) {
    if (err instanceof DemoApiError) {
      if (err.status === 401) {
        clearSession();
        if (isBrowser) window.dispatchEvent(new Event("erp-logout"));
      }
      throw new ApiClientError(err.status, err.message);
    }
    throw err instanceof Error ? err : new Error("Request failed");
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function login(email: string, password: string) {
  try {
    const body = await demoApi("POST", "/auth/login", { email, password }, null);
    setSession(body.token, body.user);
    return body.user as SessionUser;
  } catch (err) {
    if (err instanceof DemoApiError) throw new ApiClientError(err.status, err.message);
    throw err instanceof Error ? err : new Error("Login failed");
  }
}

export function logout() {
  clearSession();
  if (isBrowser) window.dispatchEvent(new Event("erp-logout"));
}

// CSV export — mirrors the backend's ?format=csv responses.
export async function downloadCsv(path: string, filename: string) {
  const csv = await demoCsv(path);
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Database backup — exports the whole demo store as JSON.
export async function downloadBackup(filename: string) {
  const data = await demoApi("GET", "/system/backup", null, bearer());
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
