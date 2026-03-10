import { clearTokens, saveTokens } from "./auth";
import { API_BASE, type AuthTokens } from "./consts";

export async function authFetch(
  url: string,
  options: RequestInit,
  tokens: AuthTokens,
  onTokensRefreshed: (tokens: AuthTokens) => void,
  onAuthFailed: () => void
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${tokens.access}`,
    },
  });

  if (res.status !== 401) return res;

  // Пробуем refresh
  const refreshRes = await fetch(`${API_BASE}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });

  if (!refreshRes.ok) {
    clearTokens();
    onAuthFailed();
    throw new Error("Session expired");
  }

  const data = (await refreshRes.json()) as { access: string; refresh?: string };
  const updated: AuthTokens = {
    access: data.access,
    refresh: data.refresh ?? tokens.refresh,
  };

  saveTokens(updated);
  onTokensRefreshed(updated);

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${updated.access}`,
    },
  });
}
