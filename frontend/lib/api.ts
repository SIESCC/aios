// ============================================================
// API Client — Typed fetch wrapper
// ============================================================

const isServer = typeof window === 'undefined';
const API_BASE = isServer
  ? (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://backend:4000/api")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");

interface ExtendedRequestInit extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export async function apiFetch<T = any>(
  endpoint: string,
  options?: ExtendedRequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const method = fetchOptions.method || "GET";
  
  const response = await fetch(url, {
    ...fetchOptions,
    method,
    headers,
    // Only apply revalidate to GET requests in Server Components
    ...(method === "GET" ? { next: { revalidate: 60, ...fetchOptions.next } } : {}),
  } as any);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ── Typed API functions ────────────────────────────────────

export const api = {
  // Tools
  tools: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/tools?${new URLSearchParams(params).toString()}`),
    trending: () => apiFetch("/tools/trending"),
    categories: () => apiFetch("/tools/categories"),
    get: (slug: string) => apiFetch(`/tools/${slug}`),
    compare: (ids: string[]) => apiFetch(`/tools/compare/tools?ids=${ids.join(",")}`),
  },
  // Models
  models: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/models?${new URLSearchParams(params).toString()}`),
    leaderboard: (type: string) => apiFetch(`/models/leaderboard/${type}`),
    get: (slug: string) => apiFetch(`/models/${slug}`),
  },
  // Research
  research: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/research?${new URLSearchParams(params).toString()}`),
    latest: () => apiFetch("/research/latest"),
    get: (id: string) => apiFetch(`/research/${id}`),
  },
  // Repos
  repos: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/repos?${new URLSearchParams(params).toString()}`),
    trending: () => apiFetch("/repos/trending"),
  },
  // Startups
  startups: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/startups?${new URLSearchParams(params).toString()}`),
    latestFunding: () => apiFetch("/startups/latest-funding"),
    get: (slug: string) => apiFetch(`/startups/${slug}`),
  },
  // Prompts
  prompts: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/prompts?${new URLSearchParams(params).toString()}`),
    categories: () => apiFetch("/prompts/categories"),
    get: (slug: string) => apiFetch(`/prompts/${slug}`),
  },
  // Trends
  trends: {
    overview: () => apiFetch("/trends/overview"),
    categories: () => apiFetch("/trends/categories"),
    news: (limit?: number) => apiFetch(`/trends/news?limit=${limit || 10}`),
  },
  // Search
  search: (query: string, type?: string) =>
    apiFetch(`/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ""}`),
};
