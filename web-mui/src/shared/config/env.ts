export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  const fallback = "https://foodieai-59215576464.me-west1.run.app";
  //const fallback = "http://127.0.0.1:8080";

  // In local development we go through the Vite proxy to avoid browser CORS checks.
  if (import.meta.env.DEV) {
    return "/api";
  }

  return raw ? raw.replace(/\/$/, "") : fallback;
}
