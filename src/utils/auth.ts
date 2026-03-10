import { LS_ACCESS, LS_REFRESH, type AuthTokens } from "./consts";

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(LS_ACCESS, tokens.access);
  localStorage.setItem(LS_REFRESH, tokens.refresh);
}

export function loadTokens(): AuthTokens | null {
  const access = localStorage.getItem(LS_ACCESS);
  const refresh = localStorage.getItem(LS_REFRESH);
  if (access && refresh) return { access, refresh };
  return null;
}

export function clearTokens() {
  localStorage.removeItem(LS_ACCESS);
  localStorage.removeItem(LS_REFRESH);
}