/**
 * Auth store - Zustand state for user and token.
 * Token is stored and used for API requests.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/services/auth.service";
import { getMe, signOut as signOutService } from "@/lib/services/auth.service";
import { setAuthToken } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      setToken: (token) => {
        set({ token });
        setAuthToken(token);
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) {
          set({
            user: null,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const user = await getMe(token);
          set({
            user,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        } catch (err) {
          set({
            user: null,
            isLoading: false,
            isInitialized: true,
            error: err instanceof Error ? err.message : "Failed to fetch user",
          });
        }
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        set({ user: null, token: null, error: null, isInitialized: true });
        setAuthToken(null);
      },

      signOut: async () => {
        await signOutService(get().token);
        get().clearAuth();
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Rehydrate: set token in API client when store loads
if (typeof window !== "undefined") {
  const token = useAuthStore.getState().token;
  if (token) setAuthToken(token);
}

// Listen for 401 to clear auth
if (typeof window !== "undefined") {
  window.addEventListener("auth:unauthorized", () => {
    useAuthStore.getState().clearAuth();
  });
}
