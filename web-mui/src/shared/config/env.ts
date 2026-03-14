export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  // In local development we go through the Vite proxy to avoid browser CORS checks.
  if (import.meta.env.DEV) {
    return "/api";
  }

  return raw ? raw.replace(/\/$/, "") : "http://localhost:8080";
}
