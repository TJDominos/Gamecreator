const CUSTOM_TOKEN_KEY = "randseed_custom_jwt";

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string | number;
  [key: string]: any;
}

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

export function getBaseApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.replace(/\/+$/, "");
  }
  return "";
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getBaseApiUrl();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = localStorage.getItem(CUSTOM_TOKEN_KEY);
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    let responseData: any;

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
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
    throw new ApiError(err instanceof Error ? err.message : "Network error", 0);
  }
}
