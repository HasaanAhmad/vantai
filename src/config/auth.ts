/**
 * Auth.js config - shared between auth routes and requireAuth middleware.
 */

import type { ExpressAuthConfig } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "@auth/express/providers/google";
import { prisma } from "@/config/db";

// Debug environment variables
console.log("[Auth Debug] AUTH_GOOGLE_ID:", process.env.AUTH_GOOGLE_ID ? "Set" : "Missing");
console.log("[Auth Debug] AUTH_GOOGLE_SECRET:", process.env.AUTH_GOOGLE_SECRET ? "Set" : "Missing");
console.log("[Auth Debug] AUTH_SECRET:", process.env.AUTH_SECRET ? "Set" : "Missing");
console.log("[Auth Debug] AUTH_URL:", process.env.AUTH_URL);

// Test database connection
prisma.$connect()
  .then(() => console.log("[Auth Debug] Database connected successfully"))
  .catch((error) => console.error("[Auth Debug] Database connection failed:", error));

export const authConfig: ExpressAuthConfig = {
  basePath: "/auth",
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
};
