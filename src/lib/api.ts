import { authClient } from "@/lib/auth-client";

const TOKEN_REFRESH_MARGIN_MS = 60_000;
const NO_TOKEN_CACHE_MS = 15_000;

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;
let noTokenUntil = 0;

function getTokenExpiry(token: string): number {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return 0;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function clearCachedToken() {
  cachedToken = null;
  cachedTokenExpiresAt = 0;
  noTokenUntil = 0;
}

export function invalidateTokenCache() {
  clearCachedToken();
}

async function getAuthorizationHeader(): Promise<string | null> {
  if (
    cachedToken &&
    cachedTokenExpiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS
  ) {
    return cachedToken;
  }

  if (!cachedToken && Date.now() < noTokenUntil) {
    return null;
  }

  try {
    const result = await authClient.token();
    const token = result.data?.token;

    if (token) {
      cachedToken = token;
      cachedTokenExpiresAt = getTokenExpiry(token);
      noTokenUntil = 0;
      return token;
    }
  } catch {
    // Fall through: an unauthenticated request is still valid for public APIs.
  }

  clearCachedToken();
  noTokenUntil = Date.now() + NO_TOKEN_CACHE_MS;
  return null;
}

export async function apiFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = await getAuthorizationHeader();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    clearCachedToken();
  }

  return response;
}
