"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/stores/auth.store";
import { signIn } from "@/lib/services/auth.service";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, isInitialized, fetchUser, signOut } = useAuthStore();

  useAuthRedirect();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSignIn = () => {
    signIn("google");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between px-4 py-16 sm:px-16">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Vantai Meeting Bot
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Sign in to trigger the meeting bot and join meetings remotely.
          </p>

          {!isInitialized || isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : user ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                {user.image && (
                  <img
                    src={user.image}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                )}
                <div className="text-left">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {user.name ?? user.email ?? "User"}
                  </p>
                  {user.email && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/meeting")}
                  className="rounded-full bg-zinc-900 px-6 py-4 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Join Meeting
                </button>
                <button
                  onClick={() => signOut()}
                  className="rounded-full border border-zinc-300 px-6 py-4 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-4 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
