/**
 * Auth service - API calls for token-based authentication.
 */

import { api, API_URL, setAuthToken } from "@/lib/api";

export interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AuthResponse {
  user: User;
}

/**
 * Get current user from backend (uses Bearer token).
 */
export async function getMe(token: string | null): Promise<User | null> {
  if (!token) return null;
  setAuthToken(token);
  try {
    const { data } = await api.get<AuthResponse>("/auth/me");
    return data.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Get sign-in URL - uses backend /auth/login which handles the full redirect chain.
 */
export function getSignInUrl(_provider: string = "google"): string {
  return `${API_URL}/auth/login`;
}

/**
 * Redirect to backend sign-in (Google OAuth).
 */
export function signIn(provider: string = "google"): void {
  window.location.href = getSignInUrl(provider);
}

/**
 * Sign out - revoke token on backend and clear local state.
 */
export async function signOut(token: string | null): Promise<void> {
  if (token) {
    setAuthToken(token);
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore - token might already be invalid
    }
  }
  setAuthToken(null);
}
