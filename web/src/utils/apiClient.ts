const ACCESS_TOKEN_KEY = "smartFoodPlan.accessToken";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!raw) {
    return "http://localhost:3000";
  }
  return raw.replace(/\/$/, "");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  const text = await response.text();
  return text.length > 0 ? text : null;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = { auth: true }
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (typeof payload === "object" && payload !== null && "message" in payload) {
      const candidate = (payload as { message?: unknown }).message;
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        message = candidate;
      }
    }
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

type AuthResponse = {
  accessToken: string;
  user?: {
    id: string;
    email: string;
  };
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(
    "/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password })
    },
    { auth: false }
  );

  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }

  return response;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(
    "/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password })
    },
    { auth: false }
  );

  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }

  return response;
}
