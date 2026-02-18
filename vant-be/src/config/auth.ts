/**
 * Auth.js config - shared between auth routes and requireAuth middleware.
 */

import type { ExpressAuthConfig } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "@auth/express/providers/google";
import { prisma } from "@/config/db";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

export const authConfig: ExpressAuthConfig = {
  basePath: "/auth",
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
    

  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin (backend token-exchange, etc.)
      try {
        const target = new URL(url);
        if (target.origin === new URL(baseUrl).origin) return url;
        if (target.origin === FRONTEND_URL) return url;
      } catch {
        // invalid URL
      }
      return baseUrl;
    },
  },
};
