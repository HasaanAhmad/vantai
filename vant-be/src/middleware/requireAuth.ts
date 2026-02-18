/**
 * Auth middleware - protects routes by requiring a valid session or Bearer token.
 */

import { getSession } from "@auth/express";
import type { Request, Response, NextFunction } from "express";
import { authConfig } from "@/config/auth";
import { validateAccessToken } from "@/services/token.service";
import { prisma } from "@/config/db";

type Session = Awaited<ReturnType<typeof getSession>>;

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

    (req as Request & { session: Session }).session = session;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Accepts either session cookie or Bearer token.
 */
export async function requireAuthOrToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (token) {
      const validated = await validateAccessToken(token);
      if (validated) {
        const user = await prisma.user.findUnique({
          where: { id: validated.userId },
          select: { id: true, name: true, email: true, image: true },
        });
        if (user) {
          (req as Request & { session: Session }).session = {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            },
            expires: "",
          };
          next();
          return;
        }
      }
    }

    const session = await getSession(req, authConfig);
    if (session?.user) {
      (req as Request & { session: Session }).session = session;
      next();
      return;
    }

    res.status(401).json({ error: "Unauthorized", message: "Sign in required" });
  } catch (err) {
    next(err);
  }
}
