"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";

/**
 * Handles OAuth redirect - extracts token from URL, stores it, fetches user.
 */
export function useAuthRedirect(): void {
  const router = useRouter();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const auth = params.get("auth");

    if (token && auth === "success") {
      setToken(token);
      fetchUser();
      router.replace(window.location.pathname, { scroll: false });
    } else if (auth === "error") {
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [setToken, fetchUser, router]);
}
