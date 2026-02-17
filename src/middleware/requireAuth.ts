/**
 * Auth middleware - protects routes by requiring a valid session.
 */

import { getSession } from "@auth/express";
import type { Request, Response, NextFunction } from "express";
import { authConfig } from "@/config/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await getSession(req, authConfig);

    if (!session?.user) {
      res.status(401).json({ error: "Unauthorized", message: "Sign in required" });
      return;
    }

    (req as Request & { session: typeof session }).session = session;
    next();
  } catch (err) {
    next(err);
  }
}
