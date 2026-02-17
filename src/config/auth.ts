/**
 * Auth.js config - shared between auth routes and requireAuth middleware.
 */

import type { ExpressAuthConfig } from "@auth/express";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "@auth/express/providers/google";
import { prisma } from "@/config/db";

export const authConfig: ExpressAuthConfig = {
  basePath: "/auth",
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  adapter: PrismaAdapter(prisma),
};
