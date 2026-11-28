const API_ROOT = "/api/v1";
const ACCESS_KEY = "construction-crm.access";
const REFRESH_KEY = "construction-crm.refresh";

export type TokenPair = { access_token: string; refresh_token: string; token_type: "bearer" };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshPromise: Promise<boolean> | null = null;

function token(key: string): string {
  return typeof window === "undefined" ? "" : window.sessionStorage.getItem(key) ?? "";
}

export function hasStoredSession(): boolean {
  return Boolean(token(ACCESS_KEY) || token(REFRESH_KEY));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
}

function expireStoredSession(): void {
  clearStoredSession();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("crm:session-expired"));
}

function storeTokens(pair: TokenPair): void {
  window.sessionStorage.setItem(ACCESS_KEY, pair.access_token);
  window.sessionStorage.setItem(REFRESH_KEY, pair.refresh_token);
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return null as T;
  const kind = response.headers.get("content-type") ?? "";
  return (kind.includes("application/json") ? response.json() : response.text()) as Promise<T>;
}

function errorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item?.msg).filter(Boolean).join(". ") || fallback;
  }
  return fallback;
}

async function refreshAccess(): Promise<boolean> {
  const refreshToken = token(REFRESH_KEY);
  if (!refreshToken) return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_ROOT}/auth/refresh`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) throw new ApiError(response.status, "Sessiya yangilanmadi");
      storeTokens(await parse<TokenPair>(response));
      return true;
    } catch {
      expireStoredSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; retry?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = "GET", body, auth = true, retry = true, signal } = options;
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (auth && token(ACCESS_KEY)) headers.set("Authorization", `Bearer ${token(ACCESS_KEY)}`);

  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Serverga ulanib bo‘lmadi. Tarmoq yoki server holatini tekshiring.");
  }

  if (response.status === 401 && auth && retry && await refreshAccess()) {
    return request<T>(path, { ...options, retry: false });
  }

  const payload = await parse<unknown>(response);
  if (!response.ok) throw new ApiError(response.status, errorMessage(payload, `So‘rov bajarilmadi (${response.status})`), payload);
  return payload as T;
}

export function signIn(username: string, password: string): Promise<TokenPair> {
  clearStoredSession();
  const body = new URLSearchParams({ username: username.trim(), password });
  return fetch(`${API_ROOT}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  }).then(async (response) => {
    const payload = await parse<unknown>(response);
    if (!response.ok) throw new ApiError(response.status, errorMessage(payload, "Kirish ma’lumoti yaroqsiz"), payload);
    storeTokens(payload as TokenPair);
    return payload as TokenPair;
  });
}

export async function signOut(): Promise<void> {
  try {
    if (token(ACCESS_KEY)) await request<null>("/auth/logout-all", { method: "POST", retry: false });
  } finally {
    clearStoredSession();
  }
}

export async function resumeAccess(): Promise<boolean> {
  if (token(ACCESS_KEY)) return true;
  return refreshAccess();
}
