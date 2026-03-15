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

const FASTAPI_BASE = isServer
  ? (process.env.INTERNAL_FASTAPI_URL || "http://fastapi:8000/api/v1")
  : (process.env.NEXT_PUBLIC_FASTAPI_URL || "/api/v1");

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

  // Route specific endpoints to FastAPI
  const isFastApiRoute = endpoint.startsWith("/search") || 
                         endpoint.startsWith("/trending") || 
                         endpoint.startsWith("/analytics") || 
                         endpoint.startsWith("/alerts") ||
                         endpoint.startsWith("/latest");

  const base = isFastApiRoute ? FASTAPI_BASE : API_BASE;
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
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
    growthAnalytics: () => apiFetch("/trends/growth-analytics"),
    industryDashboard: () => apiFetch("/trends/industry-dashboard"),
    history: (entityType?: string, days?: number) =>
      apiFetch(`/trends/history?entityType=${entityType || 'tool'}&days=${days || 30}`),
  },
  // Search
  search: (query: string, type?: string) =>
    apiFetch(`/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ""}`),
  // Recommend (new)
  recommend: (query: string, limit?: number) =>
    apiFetch(`/recommend?q=${encodeURIComponent(query)}&limit=${limit || 10}`),
  // Workflows (new)
  workflows: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/workflows?${new URLSearchParams(params).toString()}`),
    featured: () => apiFetch("/workflows/featured"),
    categories: () => apiFetch("/workflows/categories"),
    get: (slug: string) => apiFetch(`/workflows/${slug}`),
    create: (data: any) => apiFetch("/workflows", { method: "POST", body: JSON.stringify(data) }),
  },
  // Ecosystem (new)
  ecosystem: {
    graph: () => apiFetch("/ecosystem/graph"),
    stats: () => apiFetch("/ecosystem/stats"),
  },
  // Community (new)
  community: {
    list: (params?: Record<string, string>) =>
      apiFetch(`/community?${new URLSearchParams(params).toString()}`),
    stats: () => apiFetch("/community/stats"),
    submit: (data: any) => apiFetch("/community", { method: "POST", body: JSON.stringify(data) }),
  },
  // Discovery (new)
  discovery: {
    queue: (params?: Record<string, string>) =>
      apiFetch(`/discovery/queue?${new URLSearchParams(params).toString()}`),
    stats: () => apiFetch("/discovery/stats"),
  },
};
