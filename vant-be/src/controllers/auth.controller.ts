/**
 * Auth controller - token exchange and session with token support.
 */

import type { Request, Response } from "express";
import { getSession } from "@auth/express";
import { authConfig } from "@/config/auth";
import { createAccessToken, revokeAccessToken } from "@/services/token.service";
import { prisma } from "@/config/db";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

/**
 * GET /auth/login
 * Redirects to sign-in page with callbackUrl set for token exchange -> frontend.
 * Use this as the login entry point from the frontend.
 */
export function loginPage(req: Request, res: Response): void {
  const protocol = req.protocol;
  const host = req.get("host") ?? "localhost:6969";
  const baseUrl = `${protocol}://${host}`;
  const tokenExchangeUrl = `${baseUrl}/auth/token-exchange?redirect=${encodeURIComponent(FRONTEND_URL)}`;
  const signInUrl = `${baseUrl}/auth/signin/google?callbackUrl=${encodeURIComponent(tokenExchangeUrl)}`;
  res.redirect(signInUrl);
}

/**
 * GET /auth/token-exchange
 * Called after OAuth callback. Session cookie is set. Creates access token,
 * stores it, redirects to frontend with token.
 */
export async function tokenExchange(req: Request, res: Response): Promise<void> {
  try {
    const session = await getSession(req, authConfig);

    if (!session?.user?.id) {
      const errorUrl = new URL(`${FRONTEND_URL}`);
      errorUrl.searchParams.set("auth", "error");
      res.redirect(errorUrl.toString());
      return;
    }

    const token = await createAccessToken(session.user.id);
    const redirectParam = (req.query.redirect as string) || FRONTEND_URL;
    const redirectUrl = new URL(redirectParam);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("auth", "success");

    res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("[Auth] Token exchange error:", err);
    const errorUrl = new URL(FRONTEND_URL);
    errorUrl.searchParams.set("auth", "error");
    res.redirect(errorUrl.toString());
  }
}

/**
 * GET /auth/me
 * Returns current user - supports both session cookie and Bearer token.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  const session = (req as Request & { session?: { user?: { id?: string } } })
    .session;

  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true },
  });

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({ user });
}

/**
 * POST /auth/logout
 * Revokes the current access token (when using Bearer auth).
 * No auth required - revokes token if provided.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (token) {
    try {
      await revokeAccessToken(token);
    } catch {
      // Token might already be invalid
    }
  }

  res.json({ success: true });
}
