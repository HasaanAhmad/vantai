/**
 * Auth routes - ExpressAuth with Prisma adapter.
 */

import { ExpressAuth } from "@auth/express";
import { Router, type IRouter } from "express";
import { authConfig } from "@/config/auth";
import { tokenExchange, getMe, logout, loginPage } from "@/controllers/auth.controller";
import { requireAuthOrToken } from "@/middleware/requireAuth";

const authRouter: IRouter = Router();

// Login page - redirects to Google sign-in with correct callbackUrl
authRouter.get("/login", loginPage);

// Token exchange - must be before ExpressAuth (runs after OAuth callback redirect)
authRouter.get("/token-exchange", tokenExchange);

// Get current user (supports session or Bearer token)
authRouter.get("/me", requireAuthOrToken, getMe);

// Revoke token (for Bearer auth) - no auth required, revokes if token provided
authRouter.post("/logout", logout);

authRouter.use(ExpressAuth(authConfig));

export default authRouter;
