"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { setAuthToken } from "@/lib/api";

/**
 * Ensures API client has the token when store rehydrates from persist.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  return <>{children}</>;
}
