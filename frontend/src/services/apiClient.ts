import { getAuthToken, getAuthTokenKind } from "./authTokenStore";
import { sessionActions } from "../state/sessionStore";

const REQUEST_TIMEOUT_MS = 15000;

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string | number;
  [key: string]: any;
}

export const AUTH_UNAUTHORIZED_EVENT = "randseed:auth-unauthorized";

export class ApiError extends Error {
  public status: number;
  public code?: string | number;

  constructor(message: string, status: number = 400, code?: string | number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<string | null> | null = null;

export function getBaseApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.replace(/\/+$/, "");
  }
  return import.meta.env.DEV ? "https://devcreator.randseed.org" : "";
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${getBaseApiUrl()}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as { token?: string; user?: { principal_id?: string } };
      if (!payload.token) return null;
      sessionActions.establishAuthenticated(payload.token, payload.user?.principal_id);
      return payload.token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function requestInternal<T = any>(
  endpoint: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const baseUrl = getBaseApiUrl();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = getAuthToken();
  const sessionKind = getAuthTokenKind();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestController = options.signal ? null : new AbortController();
  const timeoutId = requestController
    ? window.setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS)
    : undefined;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: options.credentials ?? "include",
      headers,
      signal: requestController?.signal ?? options.signal,
    });

    const contentType = response.headers.get("content-type");
    let responseData: any;

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const isRefreshEndpoint = endpoint === "/api/auth/refresh" || endpoint.endsWith("/api/auth/refresh");
      const canRefresh = response.status === 401 && allowRefresh && !isRefreshEndpoint && Boolean(token) && sessionKind === "authenticated";
      if (canRefresh) {
        const nextToken = await refreshAccessToken();
        if (nextToken) {
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set("Authorization", `Bearer ${nextToken}`);
          return requestInternal<T>(endpoint, { ...options, headers: retryHeaders }, false);
        }
      }

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
            detail: { sessionKind },
          }));
        }
      }

      const errorMsg =
        (typeof responseData === "object" && (responseData.error || responseData.message)) ||
        `Request failed with status ${response.status}`;
      const code = typeof responseData === "object" ? responseData.code : response.status;
      throw new ApiError(errorMsg, response.status, code);
    }

    return responseData as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        requestController?.signal.aborted
          ? "Request timed out. Please try again."
          : "Request cancelled.",
        0,
      );
    }
    throw new ApiError(err instanceof Error ? err.message : "Network error", 0);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

export function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return requestInternal<T>(endpoint, options);
}
